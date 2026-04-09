const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const PHOTON_BASE_URL = "https://photon.komoot.io/api/";
const COMMON_CITY_ALIASES = {
  hyd: "hyderabad",
  blr: "bengaluru",
  bnglr: "bengaluru",
  bom: "mumbai",
  mum: "mumbai",
  del: "delhi",
  nyc: "new york",
  la: "los angeles",
  sf: "san francisco",
};

async function requestNominatim(query, options = "") {
  const url =
    `${NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(query)}` +
    `${options}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim request failed (${response.status})`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

function toPhotonDisplayName(properties) {
  const parts = [
    properties.name,
    properties.district,
    properties.city,
    properties.state,
    properties.country,
  ].filter(Boolean);
  return parts.join(", ");
}

async function requestPhoton(query, limit = 8) {
  const url = `${PHOTON_BASE_URL}?q=${encodeURIComponent(query)}&limit=${limit}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  const features = Array.isArray(payload?.features) ? payload.features : [];

  return features
    .filter((feature) => {
      const coordinates = feature?.geometry?.coordinates;
      return (
        Array.isArray(coordinates) &&
        coordinates.length === 2 &&
        Number.isFinite(coordinates[0]) &&
        Number.isFinite(coordinates[1])
      );
    })
    .map((feature, index) => {
      const [lon, lat] = feature.geometry.coordinates;
      const properties = feature.properties ?? {};
      return {
        place_id: `photon-${properties.osm_id ?? "unknown"}-${index}`,
        display_name: toPhotonDisplayName(properties) || properties.name || query,
        lat: String(lat),
        lon: String(lon),
      };
    });
}

function normalizeAliasToken(token) {
  const cleaned = token.trim().toLowerCase();
  return COMMON_CITY_ALIASES[cleaned] ?? token.trim();
}

function buildSearchVariants(query) {
  const compact = query.replace(/\s+/g, " ").trim();
  if (!compact) {
    return [];
  }

  const rawSegments = compact
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (rawSegments.length === 0) {
    return [compact];
  }

  const expandedSegments = rawSegments.map(normalizeAliasToken);
  const normalizedLine = expandedSegments.join(", ");
  const spaceOnly = expandedSegments.join(" ");
  const withoutPunctuation = compact.replace(/[.,/#!$%^&*;:{}=\-_`~()]+/g, " ");
  const reversed = [...expandedSegments].reverse().join(", ");
  const cityTail = expandedSegments.at(-1) ?? "";
  const localityTail = expandedSegments.slice(-2).join(", ");

  const variants = [
    compact,
    normalizedLine,
    spaceOnly,
    withoutPunctuation.replace(/\s+/g, " ").trim(),
    reversed,
    localityTail,
    cityTail,
  ];

  return [...new Set(variants.filter(Boolean))];
}

export async function searchLocations(query, aiVariants = []) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  const variants = [
    ...new Set([...aiVariants.map((item) => item.trim()).filter(Boolean), ...buildSearchVariants(normalizedQuery)]),
  ];
  const merged = new Map();

  for (const variant of variants) {
    const strictResults = await requestNominatim(variant, "&limit=5&polygon_geojson=1");
    for (const item of strictResults) {
      merged.set(item.place_id, item);
    }
    if (merged.size >= 10) {
      break;
    }
  }

  // Relaxed fallback improves global discovery when boundaries are unavailable.
  if (merged.size < 10) {
    for (const variant of variants) {
      const relaxedResults = await requestNominatim(variant, "&limit=12");
      for (const item of relaxedResults) {
        merged.set(item.place_id, item);
      }
      if (merged.size >= 12) {
        break;
      }
    }
  }

  if (merged.size === 0) {
    for (const variant of variants) {
      const photonResults = await requestPhoton(variant, 12);
      for (const item of photonResults) {
        merged.set(item.place_id, item);
      }
      if (merged.size >= 12) {
        break;
      }
    }
  }

  return Array.from(merged.values()).slice(0, 12);
}

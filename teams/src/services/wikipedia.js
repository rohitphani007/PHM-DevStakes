const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";
const PAGEVIEW_API_BASE =
  "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user";

function hasValidCoordinates(page) {
  if (!page || !Array.isArray(page.coordinates) || page.coordinates.length === 0) {
    return false;
  }

  const [firstCoordinate] = page.coordinates;
  return (
    firstCoordinate &&
    Number.isFinite(firstCoordinate.lat) &&
    Number.isFinite(firstCoordinate.lon)
  );
}

export async function fetchNearbyLore(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return [];
  }

  const params = new URLSearchParams({
    action: "query",
    generator: "geosearch",
    ggscoord: `${lat}|${lng}`,
    ggsradius: "10000",
    ggslimit: "30",
    prop: "coordinates|pageimages|extracts|info",
    inprop: "url",
    exintro: "1",
    explaintext: "1",
    exchars: "350",
    piprop: "thumbnail",
    pithumbsize: "400",
    format: "json",
    origin: "*",
  });

  const response = await fetch(`${WIKIPEDIA_API_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Wikipedia request failed (${response.status})`);
  }

  const payload = await response.json();
  const pages = payload?.query?.pages ? Object.values(payload.query.pages) : [];

  // Crash guard: ignore entries without usable geo coordinates.
  const safePages = pages.filter(hasValidCoordinates);

  const baseItems = safePages.map((page) => {
    const [coordinate] = page.coordinates;
    return {
      pageid: page.pageid,
      title: page.title,
      extract: page.extract ?? "",
      thumbnail: page.thumbnail?.source ?? null,
      fullurl: page.fullurl ?? `https://en.wikipedia.org/?curid=${page.pageid}`,
      coordinates: {
        lat: coordinate.lat,
        lng: coordinate.lon,
      },
    };
  });

  const enriched = await Promise.all(
    baseItems.map(async (item) => {
      const pageviews = await fetchPageviews(item.title);
      const score = calculateObscurityScore(item.extract, pageviews);
      return {
        ...item,
        pageviews,
        obscurityScore: score,
        rarityTier: getRarityTier(score),
      };
    }),
  );

  return enriched.sort((a, b) => b.obscurityScore - a.obscurityScore);
}

function toDateStamp(date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}

async function fetchPageviews(title) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);

  const normalizedTitle = encodeURIComponent(title.replace(/\s+/g, "_"));
  const url = `${PAGEVIEW_API_BASE}/${normalizedTitle}/daily/${toDateStamp(start)}/${toDateStamp(end)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    if (items.length === 0) {
      return null;
    }
    return items.reduce((sum, item) => sum + (item.views || 0), 0);
  } catch {
    return null;
  }
}

function calculateObscurityScore(extract, pageviews) {
  const textLength = (extract || "").length;
  const brevitySignal = Math.max(0, 1 - Math.min(textLength, 350) / 350);
  const viewSignal =
    pageviews == null ? 0.5 : Math.max(0, Math.min(1, 1 - Math.log10(pageviews + 1) / 6));
  const score = Math.round((0.62 * viewSignal + 0.38 * brevitySignal) * 100);
  return Math.max(1, Math.min(100, score));
}

function getRarityTier(score) {
  if (score >= 78) {
    return "legendary";
  }
  if (score >= 50) {
    return "rare";
  }
  return "common";
}

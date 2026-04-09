import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import Map, { Layer, Marker, NavigationControl, Popup, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const LIGHT_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const BOUNDARY_GLOW_LAYER = {
  id: "boundary-glow",
  type: "line",
  paint: {
    "line-color": "#ef4444",
    "line-width": 5,
    "line-opacity": 0.7,
    "line-blur": 0.6,
  },
};

const BOUNDARY_LINE_LAYER = {
  id: "boundary-outline",
  type: "line",
  paint: {
    "line-color": "#f87171",
    "line-width": 2.4,
    "line-opacity": 1,
  },
};

const BUILDINGS_3D_LAYER_ID = "curio-3d-buildings";
const DEM_SOURCE_ID = "curio-dem-source";
const CARTO_BUILDING_SOURCE = "carto";
const CARTO_BUILDING_LAYER = "building";

function updateBoundsFromCoordinates(coordinates, bounds) {
  if (!Array.isArray(coordinates)) {
    return;
  }

  if (coordinates.length === 0) {
    return;
  }

  if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
    const [lng, lat] = coordinates;
    bounds.minLng = Math.min(bounds.minLng, lng);
    bounds.minLat = Math.min(bounds.minLat, lat);
    bounds.maxLng = Math.max(bounds.maxLng, lng);
    bounds.maxLat = Math.max(bounds.maxLat, lat);
    return;
  }

  for (const child of coordinates) {
    updateBoundsFromCoordinates(child, bounds);
  }
}

export default function MapView({
  theme,
  mapMode,
  flyToTarget,
  boundary,
  loreItems,
  isLoading,
  onCenterChange,
  onMapReady,
  selectedLoreId,
  onMarkerClick,
}) {
  const mapRef = useRef(null);
  const selectedLoreItem = loreItems.find((item) => item.pageid === selectedLoreId) ?? null;

  const is3D = mapMode === "3d";
  const mapStyle = theme === "dark" ? DARK_STYLE : LIGHT_STYLE;

  const boundaryFeatureCollection = useMemo(() => {
    if (!boundary) {
      return null;
    }

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: boundary,
          properties: {},
        },
      ],
    };
  }, [boundary]);

  useEffect(() => {
    if (!flyToTarget || !mapRef.current) {
      return;
    }

    mapRef.current.flyTo({
      center: [flyToTarget.lng, flyToTarget.lat],
      zoom: flyToTarget.zoom ?? 10.5,
      duration: 1500,
      essential: true,
    });
  }, [flyToTarget]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) {
      return;
    }

    map.setPitch(is3D ? 66 : 0);
    map.setBearing(is3D ? -28 : 0);
    map.setLight({
      anchor: "map",
      color: is3D ? "#fef3c7" : "#ffffff",
      intensity: is3D ? (theme === "dark" ? 0.92 : 0.62) : 0.2,
      position: [1.35, 210, 28],
    });

    const add3DBuildingsIfPossible = () => {
      if (!is3D) {
        if (map.getLayer(BUILDINGS_3D_LAYER_ID)) {
          map.removeLayer(BUILDINGS_3D_LAYER_ID);
        }
        if (map.getTerrain()) {
          map.setTerrain(null);
        }
        return;
      }

      if (!map.getSource(DEM_SOURCE_ID)) {
        map.addSource(DEM_SOURCE_ID, {
          type: "raster-dem",
          url: "https://demotiles.maplibre.org/terrain-tiles/tiles.json",
          tileSize: 256,
          maxzoom: 14,
        });
      }
      map.setTerrain({ source: DEM_SOURCE_ID, exaggeration: theme === "dark" ? 1.42 : 1.25 });

      if (map.getLayer(BUILDINGS_3D_LAYER_ID)) {
        return;
      }

      const style = map.getStyle();
      const layers = style?.layers ?? [];
      const firstLabelLayer = layers.find(
        (layer) => layer.type === "symbol" && layer.layout?.["text-field"],
      );
      const fallbackCandidate = layers.find(
        (layer) =>
          layer.source &&
          layer["source-layer"] &&
          String(layer.id).toLowerCase().includes("building"),
      );
      const useCartoBuildingSource = Boolean(map.getSource(CARTO_BUILDING_SOURCE));
      const candidate = useCartoBuildingSource
        ? {
            source: CARTO_BUILDING_SOURCE,
            "source-layer": CARTO_BUILDING_LAYER,
          }
        : fallbackCandidate;

      if (!candidate) {
        return;
      }

      map.addLayer(
        {
          id: BUILDINGS_3D_LAYER_ID,
          type: "fill-extrusion",
          source: candidate.source,
          "source-layer": candidate["source-layer"],
          minzoom: 10.5,
          paint: {
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["coalesce", ["get", "render_height"], ["get", "height"], 8],
              0,
              theme === "dark" ? "#4b5563" : "#94a3b8",
              80,
              theme === "dark" ? "#9ca3af" : "#64748b",
              240,
              theme === "dark" ? "#f8fafc" : "#475569",
            ],
            "fill-extrusion-height": [
              "coalesce",
              ["get", "render_height"],
              ["get", "height"],
              8,
            ],
            "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
            "fill-extrusion-opacity": is3D ? 0.98 : 0,
            "fill-extrusion-vertical-gradient": true,
          },
        },
        firstLabelLayer?.id,
      );
    };

    if (map.isStyleLoaded()) {
      add3DBuildingsIfPossible();
    } else {
      map.once("styledata", add3DBuildingsIfPossible);
    }

    return () => {
      if (map.getLayer(BUILDINGS_3D_LAYER_ID)) {
        map.removeLayer(BUILDINGS_3D_LAYER_ID);
      }
      if (map.getTerrain()) {
        map.setTerrain(null);
      }
    };
  }, [theme, is3D]);

  useEffect(() => {
    if (!boundary || !mapRef.current) {
      return;
    }

    const bounds = {
      minLng: Number.POSITIVE_INFINITY,
      minLat: Number.POSITIVE_INFINITY,
      maxLng: Number.NEGATIVE_INFINITY,
      maxLat: Number.NEGATIVE_INFINITY,
    };

    updateBoundsFromCoordinates(boundary.coordinates, bounds);

    if (
      !Number.isFinite(bounds.minLng) ||
      !Number.isFinite(bounds.minLat) ||
      !Number.isFinite(bounds.maxLng) ||
      !Number.isFinite(bounds.maxLat)
    ) {
      return;
    }

    mapRef.current.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      {
        padding: {
          top: 64,
          right: 64,
          bottom: 64,
          left: 430,
        },
        duration: 1400,
        maxZoom: 15,
        pitch: is3D ? 66 : 0,
        bearing: is3D ? -28 : 0,
      },
    );
  }, [boundary, is3D]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (document.activeElement?.tagName === "INPUT") {
        return;
      }

      const panBy = 140;
      if (event.key === "ArrowUp") map.panBy([0, -panBy], { duration: 200 });
      if (event.key === "ArrowDown") map.panBy([0, panBy], { duration: 200 });
      if (event.key === "ArrowLeft") map.panBy([-panBy, 0], { duration: 200 });
      if (event.key === "ArrowRight") map.panBy([panBy, 0], { duration: 200 });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <section className="relative h-full flex-1">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -0.1276,
          latitude: 51.5072,
          zoom: 9.5,
          pitch: is3D ? 66 : 0,
          bearing: is3D ? -28 : 0,
        }}
        mapStyle={mapStyle}
        maxPitch={85}
        onMove={(event) =>
          onCenterChange({
            lng: event.viewState.longitude,
            lat: event.viewState.latitude,
          })
        }
        onLoad={() => onMapReady(mapRef.current)}
      >
        <NavigationControl position="top-right" />

        {boundaryFeatureCollection ? (
          <Source id="boundary-source" type="geojson" data={boundaryFeatureCollection}>
            <Layer {...BOUNDARY_GLOW_LAYER} />
            <Layer {...BOUNDARY_LINE_LAYER} />
          </Source>
        ) : null}

        {loreItems.map((item) => (
          <Marker
            key={item.pageid}
            longitude={item.coordinates.lng}
            latitude={item.coordinates.lat}
            anchor="bottom"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              onMarkerClick(item.pageid);
            }}
          >
            <div className="h-3 w-3 rounded-full border border-amber-200 bg-amber-500 shadow-[0_0_14px_rgba(234,179,8,0.8)]" />
          </Marker>
        ))}

        {selectedLoreItem ? (
          <Popup
            className="curio-popup"
            closeButton
            closeOnClick={false}
            maxWidth="280px"
            longitude={selectedLoreItem.coordinates.lng}
            latitude={selectedLoreItem.coordinates.lat}
            onClose={() => onMarkerClick(null)}
          >
            <p className="text-sm font-semibold leading-snug">{selectedLoreItem.title}</p>
          </Popup>
        ) : null}
      </Map>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {isLoading ? (
          <motion.div
            className="absolute h-20 w-20 rounded-full border border-emerald-300/70"
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 4.8, opacity: 0 }}
            transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
          />
        ) : null}
        <div className="relative h-8 w-8 opacity-80">
          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-zinc-100/80" />
          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-zinc-100/80" />
        </div>
      </div>
    </section>
  );
}

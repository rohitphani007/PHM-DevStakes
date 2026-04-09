import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import { searchLocations } from "./services/geocoding";
import { getAISearchVariants } from "./services/aiSearch";
import { rewriteLoreWithAI } from "./services/aiDossier";
import { fetchNearbyLore } from "./services/wikipedia";

const MIN_LOADING_TIME_MS = 7000;
const INITIAL_VISIBLE_LORE = 10;
const LORE_INCREMENT = 10;
const MapView = lazy(() => import("./components/MapView"));

export default function App() {
  const mapRef = useRef(null);
  const [theme, setTheme] = useState("dark");
  const [mapMode, setMapMode] = useState("3d");
  const [searchQuery, setSearchQuery] = useState("");
  const [loreItems, setLoreItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [boundary, setBoundary] = useState(null);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentCenter, setCurrentCenter] = useState({ lat: 51.5072, lng: -0.1276 });
  const [selectedLoreId, setSelectedLoreId] = useState(null);
  const [resultsHeading, setResultsHeading] = useState("");
  const [visibleLoreCount, setVisibleLoreCount] = useState(INITIAL_VISIBLE_LORE);
  const [previousView, setPreviousView] = useState(null);
  const [dossierMode, setDossierMode] = useState("off");
  const [curiosityScore, setCuriosityScore] = useState(0);
  const [activeAudioPageId, setActiveAudioPageId] = useState(null);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [searchInsight, setSearchInsight] = useState("");
  const [aiSearchEnabled, setAiSearchEnabled] = useState(true);
  const discoveredRarePagesRef = useRef(new Set());
  const audioUtteranceRef = useRef(null);

  const appThemeClass = useMemo(
    () => (theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-zinc-100 text-zinc-900"),
    [theme],
  );

  useEffect(() => {
    const fromStorage = window.localStorage.getItem("curioCuriosityScore");
    const parsed = Number.parseInt(fromStorage || "0", 10);
    setCuriosityScore(Number.isFinite(parsed) ? parsed : 0);
  }, []);

  useEffect(() => {
    if (loreItems.length === 0) {
      return;
    }

    let scoreDelta = 0;
    for (const item of loreItems) {
      if (discoveredRarePagesRef.current.has(item.pageid)) {
        continue;
      }
      if (item.rarityTier === "rare") {
        scoreDelta += 3;
        discoveredRarePagesRef.current.add(item.pageid);
      } else if (item.rarityTier === "legendary") {
        scoreDelta += 8;
        discoveredRarePagesRef.current.add(item.pageid);
      }
    }

    if (scoreDelta > 0) {
      setCuriosityScore((prev) => {
        const next = prev + scoreDelta;
        window.localStorage.setItem("curioCuriosityScore", String(next));
        return next;
      });
    }
  }, [loreItems]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  async function runWithMinimumLoader(task) {
    setIsLoading(true);
    const start = Date.now();

    try {
      await task();
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_LOADING_TIME_MS - elapsed);
      await new Promise((resolve) => {
        window.setTimeout(resolve, remaining);
      });
      setIsLoading(false);
    }
  }

  function parseNominatimResult(item) {
    const lat = Number.parseFloat(item.lat);
    const lng = Number.parseFloat(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    return { lat, lng };
  }

  async function getNearestSpellingMatches(query) {
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
        query,
      )}&limit=10&namespace=0&format=json&origin=*`,
    );
    if (!response.ok) {
      return [];
    }
    const payload = await response.json();
    return Array.isArray(payload?.[1]) ? payload[1] : [];
  }

  function parseCoordinateQuery(query) {
    const match = query.trim().match(
      /^(-?\d+(?:\.\d+)?)\s*[,|\s]\s*(-?\d+(?:\.\d+)?)$/,
    );
    if (!match) {
      return null;
    }

    const lat = Number.parseFloat(match[1]);
    const lng = Number.parseFloat(match[2]);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return null;
    }

    return { lat, lng };
  }

  function buildFallbackBoundary(center, radiusKm = 2.4, points = 56) {
    const { lat, lng } = center;
    const latRadians = (lat * Math.PI) / 180;
    const kmPerDegreeLat = 110.574;
    const kmPerDegreeLng = 111.32 * Math.cos(latRadians);
    const safeLngScale = Math.abs(kmPerDegreeLng) < 0.0001 ? 0.0001 : kmPerDegreeLng;

    const ring = [];
    for (let step = 0; step <= points; step += 1) {
      const angle = (step / points) * Math.PI * 2;
      const latOffset = (radiusKm * Math.sin(angle)) / kmPerDegreeLat;
      const lngOffset = (radiusKm * Math.cos(angle)) / safeLngScale;
      ring.push([lng + lngOffset, lat + latOffset]);
    }

    return {
      type: "Polygon",
      coordinates: [ring],
    };
  }

  async function runLocationSearch(query) {
    const coordinateTarget = parseCoordinateQuery(query);
    if (coordinateTarget) {
      setBoundary(buildFallbackBoundary(coordinateTarget));
      setSuggestions([]);
      setFlyToTarget(coordinateTarget);
      setCurrentCenter(coordinateTarget);
      setResultsHeading(
        `Exciting places around ${coordinateTarget.lat.toFixed(4)}, ${coordinateTarget.lng.toFixed(4)}`,
      );

      const coordinateLore = await fetchNearbyLore(coordinateTarget.lat, coordinateTarget.lng);
      setLoreItems(coordinateLore);
      setVisibleLoreCount(INITIAL_VISIBLE_LORE);
      if (coordinateLore.length === 0) {
        setErrorMessage("Coordinates found, but no nearby lore was returned within 10km.");
      }
      return;
    }

    const aiVariants = aiSearchEnabled ? await getAISearchVariants(query) : [];
    if (aiVariants.length > 0) {
      setSearchInsight(`AI interpreted query as: ${aiVariants[0]}`);
    } else {
      setSearchInsight("");
    }

    const results = await searchLocations(query, aiVariants);
    if (results.length === 0) {
      setBoundary(null);
      setLoreItems([]);
      setResultsHeading("");
      setSearchInsight("");
      const nearestMatches = await getNearestSpellingMatches(query);
      if (nearestMatches.length > 0) {
        setSuggestions(nearestMatches);
        setErrorMessage("Location not found. Try one of the nearest spelling matches below.");
      } else {
        setErrorMessage("No places found. Try a broader or differently spelled query.");
      }
      return;
    }

    const [topMatch, ...otherMatches] = results;
    const topCoordinates = parseNominatimResult(topMatch);
    if (!topCoordinates) {
      setBoundary(null);
      setErrorMessage("Search response was incomplete. Please try another location.");
      return;
    }

    setFlyToTarget(topCoordinates);
    setCurrentCenter(topCoordinates);
    setBoundary(topMatch.geojson ?? buildFallbackBoundary(topCoordinates));
    setSuggestions(otherMatches.slice(0, 10));
    setResultsHeading(`Exciting places around ${topMatch.display_name}`);

    const nearbyLore = await fetchNearbyLore(topCoordinates.lat, topCoordinates.lng);
    setLoreItems(nearbyLore);
    setVisibleLoreCount(INITIAL_VISIBLE_LORE);
    if (nearbyLore.length === 0) {
      setErrorMessage("Place found, but no nearby lore was returned within 10km.");
    }
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      return;
    }

    setErrorMessage("");
    setSuggestions([]);
    setSearchInsight("");
    setSelectedLoreId(null);
    setVisibleLoreCount(INITIAL_VISIBLE_LORE);

    await runWithMinimumLoader(async () => {
      await runLocationSearch(query);
    });
  }

  async function scanCoordinates(lat, lng) {
    setErrorMessage("");
    setSelectedLoreId(null);
    setLoreItems([]);
    setVisibleLoreCount(INITIAL_VISIBLE_LORE);
    setResultsHeading("Exciting places around current target");
    await runWithMinimumLoader(async () => {
      const results = await fetchNearbyLore(lat, lng);
      setLoreItems(results);
      setVisibleLoreCount(INITIAL_VISIBLE_LORE);
      if (results.length === 0) {
        setErrorMessage("No lore found within a 10km radius at this target.");
      }
    });
  }

  async function handleScan() {
    const center = mapRef.current?.getMap()?.getCenter();
    const lat = center?.lat ?? currentCenter.lat;
    const lng = center?.lng ?? currentCenter.lng;
    await scanCoordinates(lat, lng);
  }

  async function handleSuggestionClick(suggestion) {
    const suggestionLabel =
      typeof suggestion === "string" ? suggestion : suggestion.display_name;
    setSearchQuery(suggestionLabel);
    setErrorMessage("");
    setSelectedLoreId(null);
    setVisibleLoreCount(INITIAL_VISIBLE_LORE);

    if (typeof suggestion === "string") {
      await runWithMinimumLoader(async () => {
        await runLocationSearch(suggestion);
      });
      return;
    }

    await runWithMinimumLoader(async () => {
      const coordinates = parseNominatimResult(suggestion);
      if (!coordinates) {
        setErrorMessage("Unable to read this suggestion's coordinates.");
        return;
      }

      setFlyToTarget(coordinates);
      setCurrentCenter(coordinates);
      setBoundary(suggestion.geojson ?? buildFallbackBoundary(coordinates));
      setSuggestions([]);
      setResultsHeading(`Exciting places around ${suggestion.display_name}`);

      const nearbyLore = await fetchNearbyLore(coordinates.lat, coordinates.lng);
      setLoreItems(nearbyLore);
      setVisibleLoreCount(INITIAL_VISIBLE_LORE);
      if (nearbyLore.length === 0) {
        setErrorMessage("Suggestion selected, but no nearby lore was found within 10km.");
      }
    });
  }

  function handleFindOnMap(item) {
    if (!item?.coordinates) {
      return;
    }

    const map = mapRef.current?.getMap();
    if (map) {
      const center = map.getCenter();
      const zoom = map.getZoom();
      setPreviousView({
        lat: center.lat,
        lng: center.lng,
        zoom,
      });
    }

    setFlyToTarget({
      lat: item.coordinates.lat,
      lng: item.coordinates.lng,
      zoom: 14.5,
    });
    setSelectedLoreId(item.pageid);
  }

  function handleReturnToPreviousView() {
    if (!previousView) {
      return;
    }

    setFlyToTarget(previousView);
    setSelectedLoreId(null);
    setPreviousView(null);
  }

  async function handleGenerateDossier(item) {
    const rewritten = await rewriteLoreWithAI({
      title: item.title,
      summary: item.extract,
      mode: dossierMode,
    });
    setLoreItems((prev) =>
      prev.map((entry) =>
        entry.pageid === item.pageid ? { ...entry, dossierText: rewritten } : entry,
      ),
    );
  }

  function pickClearFemaleVoice() {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const femaleHint = /(female|woman|zira|samantha|victoria|karen|moira|aria|jenny|eva|serena)/i;
    return (
      voices.find((voice) => femaleHint.test(voice.name) && /^en/i.test(voice.lang)) ||
      voices.find((voice) => /^en/i.test(voice.lang)) ||
      voices[0] ||
      null
    );
  }

  function handlePlayAudio(item) {
    const synthesis = window.speechSynthesis;
    if (!synthesis) {
      return;
    }

    if (activeAudioPageId === item.pageid && isAudioPaused) {
      synthesis.resume();
      setIsAudioPaused(false);
      return;
    }

    synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(item.dossierText || item.extract || item.title);
    utterance.voice = pickClearFemaleVoice();
    utterance.rate = 0.96;
    utterance.pitch = 1.02;
    utterance.volume = 1;
    utterance.onend = () => {
      setActiveAudioPageId(null);
      setIsAudioPaused(false);
      audioUtteranceRef.current = null;
    };
    audioUtteranceRef.current = utterance;
    setActiveAudioPageId(item.pageid);
    setIsAudioPaused(false);
    synthesis.speak(utterance);
  }

  function handlePauseAudio(item) {
    if (activeAudioPageId !== item.pageid) {
      return;
    }
    const synthesis = window.speechSynthesis;
    if (!synthesis?.speaking || synthesis.paused) {
      return;
    }
    synthesis.pause();
    setIsAudioPaused(true);
  }

  function handleResumeAudio(item) {
    if (activeAudioPageId !== item.pageid) {
      return;
    }
    const synthesis = window.speechSynthesis;
    if (!synthesis?.paused) {
      return;
    }
    synthesis.resume();
    setIsAudioPaused(false);
  }

  return (
    <main
      className={`h-screen w-screen overflow-hidden ${appThemeClass} ${
        theme === "dark" ? "theme-dark" : "theme-light"
      }`}
    >
      <div className="flex h-full w-full">
        <Sidebar
          theme={theme}
          mapMode={mapMode}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onScan={handleScan}
          isLoading={isLoading}
          loreItems={loreItems}
          resultsHeading={resultsHeading}
          suggestions={suggestions}
          searchInsight={searchInsight}
          onSuggestionClick={handleSuggestionClick}
          errorMessage={errorMessage}
          onFindOnMap={handleFindOnMap}
          visibleCount={visibleLoreCount}
          onShowMore={() =>
            setVisibleLoreCount((prev) => Math.min(prev + LORE_INCREMENT, loreItems.length))
          }
          canReturnToPreviousView={Boolean(previousView)}
          onReturnToPreviousView={handleReturnToPreviousView}
          dossierMode={dossierMode}
          onToggleDossierMode={() =>
            setDossierMode((prev) =>
              prev === "off" ? "classified" : prev === "classified" ? "storyteller" : "off",
            )
          }
          curiosityScore={curiosityScore}
          onGenerateDossier={handleGenerateDossier}
          activeAudioPageId={activeAudioPageId}
          isAudioPaused={isAudioPaused}
          onPlayAudio={handlePlayAudio}
          onPauseAudio={handlePauseAudio}
          onResumeAudio={handleResumeAudio}
          onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          onToggleMapMode={() => setMapMode((prev) => (prev === "3d" ? "2d" : "3d"))}
          aiSearchEnabled={aiSearchEnabled}
          onToggleAiSearch={() => setAiSearchEnabled((prev) => !prev)}
        />
        <Suspense
          fallback={
            <section
              className={`relative flex h-full flex-1 items-center justify-center ${
                theme === "dark" ? "bg-zinc-950" : "bg-zinc-100"
              }`}
            >
              <div
                className={`glass-card rounded-2xl px-6 py-4 text-sm ${
                  theme === "dark" ? "text-zinc-300" : "text-zinc-700"
                }`}
              >
                Initializing map engine...
              </div>
            </section>
          }
        >
          <MapView
            theme={theme}
            mapMode={mapMode}
            flyToTarget={flyToTarget}
            boundary={boundary}
            loreItems={loreItems}
            isLoading={isLoading}
            onCenterChange={setCurrentCenter}
            onMapReady={(nextMapRef) => {
              mapRef.current = nextMapRef;
            }}
            selectedLoreId={selectedLoreId}
            onMarkerClick={setSelectedLoreId}
          />
        </Suspense>
      </div>
    </main>
  );
}
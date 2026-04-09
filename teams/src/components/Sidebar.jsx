import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import LoreCard from "./LoreCard";
import Loader from "./Loader";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

function LoreCardSkeleton({ theme }) {
  const blockClass = theme === "dark" ? "bg-zinc-800/80" : "bg-zinc-300/80";
  const lineClass = theme === "dark" ? "bg-zinc-800/70" : "bg-zinc-300/70";

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className={`h-44 w-full animate-pulse ${blockClass}`} />
      <div className="space-y-3 p-4">
        <div className={`h-5 w-2/3 animate-pulse rounded ${blockClass}`} />
        <div className={`h-3 w-full animate-pulse rounded ${lineClass}`} />
        <div className={`h-3 w-11/12 animate-pulse rounded ${lineClass}`} />
        <div className={`h-3 w-4/5 animate-pulse rounded ${lineClass}`} />
        <div className={`h-8 w-32 animate-pulse rounded-lg ${blockClass}`} />
      </div>
    </div>
  );
}

function EmptyState({ theme }) {
  const titleClass = theme === "dark" ? "text-zinc-200" : "text-zinc-800";
  const bodyClass = theme === "dark" ? "text-zinc-400" : "text-zinc-600";

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-full border border-amber-500/40 bg-amber-500/10">
          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-amber-300/70" />
          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-amber-300/70" />
        </div>
        <p className={`text-sm font-medium ${titleClass}`}>Curious places are waiting</p>
      </div>
      <p className={`text-sm leading-relaxed ${bodyClass}`}>
        Drag or arrow-key surf the map, keep the crosshair over your target, then scan to
        reveal hidden local lore nearby.
      </p>
    </div>
  );
}

export default function Sidebar({
  theme,
  mapMode,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  onScan,
  isLoading,
  loreItems,
  resultsHeading,
  searchInsight,
  suggestions,
  onSuggestionClick,
  errorMessage,
  onToggleTheme,
  onFindOnMap,
  visibleCount,
  onShowMore,
  canReturnToPreviousView,
  onReturnToPreviousView,
  onToggleMapMode,
  dossierMode,
  onToggleDossierMode,
  curiosityScore,
  onGenerateDossier,
  activeAudioPageId,
  isAudioPaused,
  onPlayAudio,
  onPauseAudio,
  onResumeAudio,
  aiSearchEnabled,
  onToggleAiSearch,
}) {
  const [isNearBottom, setIsNearBottom] = useState(false);
  const isDark = theme === "dark";
  const asideClass = isDark
    ? "border-zinc-800/80 bg-zinc-950/90 text-zinc-100"
    : "border-zinc-300/80 bg-zinc-50/90 text-zinc-900";
  const headerClass = isDark ? "border-zinc-800/80" : "border-zinc-300/80";
  const headingClass = isDark ? "text-zinc-50" : "text-zinc-900";
  const secondaryButtonClass = isDark
    ? "border-zinc-700 bg-zinc-900/75 text-zinc-100"
    : "border-zinc-300 bg-white/80 text-zinc-900";
  const inputClass = isDark
    ? "border-zinc-700 bg-zinc-900/75 text-zinc-100"
    : "border-zinc-300 bg-white/90 text-zinc-900";
  const suggestionWrapClass = isDark
    ? "border-zinc-800 bg-zinc-900/70"
    : "border-zinc-300 bg-white/80";
  const suggestionLabelClass = isDark ? "text-zinc-500" : "text-zinc-600";
  const suggestionButtonClass = isDark
    ? "border-zinc-700 text-zinc-300"
    : "border-zinc-300 text-zinc-700";
  const errorClass = isDark
    ? "border-red-500/40 bg-red-500/10 text-red-200"
    : "border-red-500/60 bg-red-100 text-red-800";
  const showMoreClass = isDark
    ? "border-zinc-700 bg-zinc-900/75 text-zinc-100"
    : "border-zinc-300 bg-white text-zinc-900";
  const visibleLoreItems = loreItems.slice(0, visibleCount);
  const hasMorePlaces = loreItems.length > visibleCount;
  const scoreBadgeClass = isDark
    ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
    : "border-amber-500/50 bg-amber-100 text-amber-900";
  return (
    <aside
      className={`relative z-20 flex h-full w-full max-w-[440px] shrink-0 flex-col border-r backdrop-blur-xl ${asideClass}`}
    >
      <header className={`space-y-4 border-b p-6 ${headerClass}`}>
        <div className="flex items-start justify-between gap-3">
          <h1 className={`text-3xl font-bold tracking-tight ${headingClass}`}>
            Curio<span className="text-amber-500">City</span>
          </h1>
          <div className={`rounded-lg border px-2.5 py-2 text-xs font-semibold ${scoreBadgeClass}`}>
            Curiosity: {curiosityScore}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={onToggleMapMode}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition hover:border-amber-500/50 hover:text-amber-300 ${secondaryButtonClass}`}
          >
            {mapMode === "3d" ? "2D View" : "3D View"}
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition hover:border-amber-500/50 hover:text-amber-300 ${secondaryButtonClass}`}
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button
            type="button"
            onClick={onToggleDossierMode}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition hover:border-amber-500/50 hover:text-amber-300 ${secondaryButtonClass}`}
          >
            {dossierMode === "off"
              ? "Narrative Off"
              : dossierMode === "classified"
                ? "Dossier"
                : "Adaptive Story"}
          </button>
          <button
            type="button"
            onClick={onToggleAiSearch}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition hover:border-amber-500/50 hover:text-amber-300 ${secondaryButtonClass}`}
          >
            {aiSearchEnabled ? "AI Search On" : "AI Search Off"}
          </button>
        </div>

        <form onSubmit={onSearchSubmit} className="space-y-3">
          <input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            type="text"
            placeholder="Search city, region, or landmark..."
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-amber-500/70 ${inputClass}`}
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Search Place
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onScan}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition hover:border-amber-500/50 disabled:cursor-not-allowed disabled:opacity-60 ${secondaryButtonClass}`}
            >
              Scan Target Coordinates
            </button>
          </div>
          {canReturnToPreviousView ? (
            <button
              type="button"
              disabled={isLoading}
              onClick={onReturnToPreviousView}
              className={`w-full rounded-xl border px-4 py-2 text-sm font-semibold transition hover:border-amber-500/50 disabled:cursor-not-allowed disabled:opacity-60 ${secondaryButtonClass}`}
            >
              Back to Previous View
            </button>
          ) : null}
        </form>

        {suggestions.length > 0 && (
          <div className={`space-y-2 rounded-xl border p-3 ${suggestionWrapClass}`}>
            <p className={`text-xs uppercase tracking-widest ${suggestionLabelClass}`}>
              Nearest matches for your spelling
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${typeof suggestion === "string" ? suggestion : suggestion.place_id}-${index}`}
                  type="button"
                  onClick={() => onSuggestionClick(suggestion)}
                  className={`rounded-full border px-3 py-1 text-xs transition hover:border-amber-500/60 hover:text-amber-300 ${suggestionButtonClass}`}
                >
                  {typeof suggestion === "string" ? suggestion : suggestion.display_name}
                </button>
              ))}
            </div>
          </div>
        )}
        {searchInsight ? (
          <div className={`rounded-xl border p-3 text-xs ${suggestionWrapClass}`}>
            <p className={`uppercase tracking-widest ${suggestionLabelClass}`}>AI Search Assist</p>
            <p className="mt-1 leading-relaxed">{searchInsight}</p>
          </div>
        ) : null}
      </header>

      <section
        className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6"
        onScroll={(event) => {
          const element = event.currentTarget;
          const threshold = 28;
          const nearBottom =
            element.scrollTop + element.clientHeight >= element.scrollHeight - threshold;
          setIsNearBottom(nearBottom);
        }}
      >
        {errorMessage ? (
          <div className={`rounded-xl border p-3 text-sm font-medium ${errorClass}`}>
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <>
            <Loader />
            <LoreCardSkeleton theme={theme} />
            <LoreCardSkeleton theme={theme} />
            <LoreCardSkeleton theme={theme} />
          </>
        ) : null}

        {!isLoading && loreItems.length === 0 && !errorMessage ? (
          <EmptyState theme={theme} />
        ) : null}

        <AnimatePresence mode="popLayout">
          {!isLoading && loreItems.length > 0 ? (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
              <div className="glass-card rounded-xl px-4 py-3">
                <p className={`text-xs uppercase tracking-[0.18em] ${suggestionLabelClass}`}>
                  Discovery Feed
                </p>
                <h2 className={`mt-1 text-sm font-medium ${headingClass}`}>
                  {resultsHeading || "Exciting places nearby"}
                </h2>
              </div>
              {visibleLoreItems.map((item) => (
                <motion.div key={item.pageid} variants={itemVariants}>
                  <LoreCard
                    item={item}
                    theme={theme}
                    onFindOnMap={onFindOnMap}
                    dossierMode={dossierMode}
                    onGenerateDossier={onGenerateDossier}
                    isAudioActive={activeAudioPageId === item.pageid}
                    isAudioPaused={isAudioPaused}
                    onPlayAudio={onPlayAudio}
                    onPauseAudio={onPauseAudio}
                    onResumeAudio={onResumeAudio}
                  />
                </motion.div>
              ))}
              {hasMorePlaces && isNearBottom ? (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onShowMore}
                    className={`w-full rounded-xl border px-4 py-2 text-sm font-semibold transition hover:border-amber-500/50 ${showMoreClass}`}
                  >
                    Show More Places
                  </button>
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>
    </aside>
  );
}

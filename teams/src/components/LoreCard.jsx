export default function LoreCard({
  item,
  theme,
  onFindOnMap,
  dossierMode,
  onGenerateDossier,
  isAudioActive,
  isAudioPaused,
  onPlayAudio,
  onPauseAudio,
  onResumeAudio,
}) {
  const titleClass = theme === "dark" ? "text-zinc-100" : "text-zinc-900";
  const bodyClass = theme === "dark" ? "text-zinc-300" : "text-zinc-700";
  const noImageClass = theme === "dark" ? "bg-zinc-900 text-zinc-500" : "bg-zinc-200 text-zinc-600";
  const mapActionClass =
    theme === "dark"
      ? "border-zinc-400/40 bg-zinc-500/10 text-zinc-300 hover:border-zinc-300/70 hover:bg-zinc-500/20"
      : "border-zinc-400/70 bg-zinc-100 text-zinc-800 hover:border-zinc-500 hover:bg-zinc-200";
  const knowMoreClass =
    theme === "dark"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-400 hover:bg-amber-500/20"
      : "border-amber-500 bg-amber-200 text-amber-900 hover:border-amber-600 hover:bg-amber-300";
  const rarityClass =
    item.rarityTier === "legendary"
      ? "border-amber-400/70 shadow-[0_0_24px_rgba(234,179,8,0.35)]"
      : item.rarityTier === "rare"
        ? "border-blue-500/60"
        : "border-zinc-500/40";

  return (
    <article className={`glass-card overflow-hidden rounded-2xl border ${rarityClass}`}>
      {item.thumbnail ? (
        <img
          src={item.thumbnail}
          alt={item.title}
          className="h-44 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className={`flex h-28 items-center justify-center text-xs uppercase tracking-[0.18em] ${noImageClass}`}>
          No image available
        </div>
      )}

      <div className="space-y-3 p-4">
        <h3 className={`text-lg font-semibold ${titleClass}`}>{item.title}</h3>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              item.rarityTier === "legendary"
                ? "bg-amber-400/20 text-amber-300"
                : item.rarityTier === "rare"
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-zinc-500/20 text-zinc-300"
            }`}
          >
            {item.rarityTier}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">
            Obscurity {item.obscurityScore}
          </span>
        </div>
        <p className={`text-sm leading-relaxed ${bodyClass}`}>
          {item.dossierText || item.extract || "No summary available for this entry."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onFindOnMap(item)}
            className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition ${mapActionClass}`}
          >
            Find on Map
          </button>
          <button
            type="button"
            onClick={() => onGenerateDossier(item)}
            disabled={dossierMode === "off"}
            className="inline-flex items-center rounded-lg border border-violet-500/50 bg-violet-500/10 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-violet-300 transition hover:border-violet-400 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Generate Dossier
          </button>
          <button
            type="button"
            onClick={() => onPlayAudio(item)}
            className="inline-flex items-center rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/20"
          >
            {isAudioActive && !isAudioPaused ? "Replay Audio" : "Play Audio"}
          </button>
          {isAudioActive && !isAudioPaused ? (
            <button
              type="button"
              onClick={() => onPauseAudio(item)}
              className="inline-flex items-center rounded-lg border border-emerald-500/50 bg-emerald-900/30 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-emerald-200 transition hover:border-emerald-400"
            >
              Pause Audio
            </button>
          ) : null}
          {isAudioActive && isAudioPaused ? (
            <button
              type="button"
              onClick={() => onResumeAudio(item)}
              className="inline-flex items-center rounded-lg border border-emerald-500/50 bg-emerald-700/20 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-emerald-100 transition hover:border-emerald-400"
            >
              Resume Audio
            </button>
          ) : null}
          <a
            href={item.fullurl}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition ${knowMoreClass}`}
          >
            Know More
          </a>
        </div>
      </div>
    </article>
  );
}

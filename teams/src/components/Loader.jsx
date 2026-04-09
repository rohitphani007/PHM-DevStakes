import { useEffect, useState } from "react";
import { FUN_FACTS } from "../constants/funFacts";

const FACT_ROTATION_MS = 2500;

export default function Loader() {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, FACT_ROTATION_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="glass-card flex h-auto w-full flex-col items-center gap-4 rounded-2xl p-6">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-500/70 border-t-amber-500" />
      <p className="text-center text-sm leading-relaxed text-inherit">
        {FUN_FACTS[factIndex]}
      </p>
      <p className="text-xs uppercase tracking-widest text-zinc-500">
        Decoding local geography...
      </p>
    </div>
  );
}

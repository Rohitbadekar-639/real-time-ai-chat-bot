import { useEffect, useState } from "react";
import { pingApi } from "../config/health";

export default function StatusPill() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    async function tick() {
      if (inFlight) return;
      inFlight = true;
      try {
        const next = await pingApi(50000);
        if (!cancelled) setStatus(next);
      } finally {
        inFlight = false;
      }
    }

    tick();
    const id = setInterval(tick, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const live = Boolean(status?.ok && status?.mongo);
  const label = !status
    ? "Connecting…"
    : live
      ? "Live"
      : status.ok
        ? "API up · connecting database"
        : "Waking server…";

  const color = live
    ? "bg-tide"
    : status?.ok
      ? "bg-gold"
      : "bg-amber-400";

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
      <span className={`h-1.5 w-1.5 rounded-full ${color} ${live ? "" : "animate-pulse"}`} />
      {label}
    </span>
  );
}

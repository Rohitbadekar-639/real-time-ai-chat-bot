import { useEffect, useState } from "react";
import { pingApi } from "../config/health";

export default function StatusPill({ compact = false }) {
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
    const live = Boolean(status?.ok && status?.mongo);
    const id = setInterval(tick, live ? 20000 : 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [status?.ok, status?.mongo]);

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
    <span
      role="status"
      aria-live="polite"
      title={label}
      className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-200"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${color} ${live ? "" : "animate-pulse"}`} />
      <span className={compact ? "max-sm:sr-only" : undefined}>{label}</span>
    </span>
  );
}

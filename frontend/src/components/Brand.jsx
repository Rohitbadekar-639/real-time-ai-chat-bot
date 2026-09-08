export default function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-gold/30 bg-ink-700 shadow-[0_0_24px_rgba(232,197,132,0.18)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <path
            d="M4 16V8l8-4 8 4v8l-8 4-8-4z"
            stroke="#e8c584"
            strokeWidth="1.6"
          />
          <path d="M12 8v8M4 10l8 4 8-4" stroke="#7dd3c7" strokeWidth="1.4" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="font-display block text-lg font-bold tracking-tight text-white">
            Nexora
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.22em] text-zinc-500 sm:block">
            Live coding rooms
          </span>
        </span>
      )}
    </div>
  );
}

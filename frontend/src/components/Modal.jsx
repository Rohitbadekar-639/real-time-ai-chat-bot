import { useEffect, useId, useRef } from "react";

export default function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  labelledBy,
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const previous = document.activeElement;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = panelRef.current?.querySelector(
      "input, button, textarea, select, [href], [tabindex]:not([tabindex='-1'])"
    );
    focusable?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || titleId}
        aria-describedby={description ? descId : undefined}
        className="max-h-[92dvh] w-full overflow-auto rounded-t-3xl border border-white/10 bg-ink-800 p-5 shadow-2xl sm:max-w-md sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id={labelledBy || titleId} className="font-display text-xl font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-zinc-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-zinc-400 hover:bg-white/5 hover:text-white"
            aria-label="Close dialog"
          >
            <i className="ri-close-line text-xl" aria-hidden />
          </button>
        </header>
        {children}
        {footer}
      </div>
    </div>
  );
}

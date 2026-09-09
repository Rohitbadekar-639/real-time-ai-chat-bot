import { useEffect, useMemo, useRef } from "react";
import { highlightCode } from "../config/highlight";

export default function CodeEditor({ filename, value, onChange }) {
  const preRef = useRef(null);
  const areaRef = useRef(null);
  const html = useMemo(
    () => highlightCode(filename, value || "") + "\n",
    [filename, value]
  );

  function syncScroll() {
    if (preRef.current && areaRef.current) {
      preRef.current.scrollTop = areaRef.current.scrollTop;
      preRef.current.scrollLeft = areaRef.current.scrollLeft;
    }
  }

  useEffect(() => {
    syncScroll();
  }, [value, filename]);

  return (
    <div className="nexora-editor relative min-h-0 flex-1 overflow-hidden bg-ink-950">
      <pre
        ref={preRef}
        className="hljs pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap break-words p-5 pb-32"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <label htmlFor="workspace-editor" className="sr-only">
        Edit {filename}
      </label>
      <textarea
        id="workspace-editor"
        ref={areaRef}
        value={value}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        onScroll={syncScroll}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          event.preventDefault();
          const node = event.currentTarget;
          const start = node.selectionStart;
          const end = node.selectionEnd;
          const next = `${value.slice(0, start)}  ${value.slice(end)}`;
          onChange(next);
          requestAnimationFrame(() => {
            node.selectionStart = node.selectionEnd = start + 2;
          });
        }}
        className="absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent p-5 pb-32 font-mono text-[13px] leading-[1.6] text-transparent caret-gold outline-none"
      />
    </div>
  );
}

import hljs from "highlight.js";

if (typeof window !== "undefined") {
  window.hljs = hljs;
}

export function langFromFile(name = "") {
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".html") || name.endsWith(".xml")) return "xml";
  if (name.endsWith(".css")) return "css";
  if (name.endsWith(".md")) return "markdown";
  return "javascript";
}

export function highlightCode(filename, source) {
  const code = source || "";
  try {
    return hljs.highlight(code, { language: langFromFile(filename) }).value;
  } catch {
    return hljs.highlightAuto(code).value;
  }
}

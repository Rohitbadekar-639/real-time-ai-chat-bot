export const STARTERS = [
  {
    id: "express",
    title: "Express homepage",
    hint: "Best first demo",
    prompt:
      "@ai create a small Express app with a homepage that says Nexora and a /health JSON route. Include package.json with a start script.",
  },
  {
    id: "todo",
    title: "Todo API",
    hint: "REST + HTML",
    prompt:
      "@ai create a small Express todo API with an in-memory list, GET/POST /todos, and a simple homepage. Include package.json with a start script.",
  },
  {
    id: "landing",
    title: "Product landing",
    hint: "Static page in Node",
    prompt:
      "@ai create an Express app that serves a polished landing page for Nexora, a live AI coding room. Include package.json with a start script.",
  },
];

export const CAPABILITIES = [
  {
    icon: "ri-chat-smile-3-line",
    title: "Live room chat",
    body: "Socket.IO chat like WhatsApp: solo, 1:1, or a group. Messages persist.",
  },
  {
    icon: "ri-sparkling-2-line",
    title: "AI file generation",
    body: "Type @ai and the assistant returns a real file tree you can open, not just a code snippet.",
  },
  {
    icon: "ri-code-s-slash-line",
    title: "In-room editor",
    body: "Click a file, edit it, and save. The workspace stays attached to the room.",
  },
  {
    icon: "ri-play-circle-line",
    title: "Run in the browser",
    body: "WebContainers start Node here — npm install, npm start, then a live preview.",
  },
];

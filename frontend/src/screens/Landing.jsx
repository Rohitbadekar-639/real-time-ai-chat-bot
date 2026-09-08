import { Link } from "react-router-dom";
import Brand from "../components/Brand";
import StatusPill from "../components/StatusPill";
import { CAPABILITIES, STARTERS } from "../data/starters";

const steps = [
  {
    n: "01",
    title: "Create a room",
    body: "A room is a named workspace with chat, files, and a Run button — like a tiny IDE for one task.",
  },
  {
    n: "02",
    title: "Ask @ai to build",
    body: "Use a starter prompt. The assistant returns real files (Express, HTML, package.json), not a chat essay.",
  },
  {
    n: "03",
    title: "Edit, then Run",
    body: "Open a file, change a line, click Run. Node starts in the browser and a preview appears.",
  },
];

const stack = [
  "MongoDB",
  "Express",
  "React",
  "Node.js",
  "Socket.IO",
  "OpenAI",
  "WebContainers",
  "JWT",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100 grain">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Brand />
        <div className="flex items-center gap-3">
          <StatusPill />
          <Link
            to="/login"
            className="hidden rounded-full px-4 py-2 text-sm text-zinc-300 hover:text-white sm:inline"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-amber-200"
          >
            Open a workspace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 px-6 py-14 sm:px-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-tide/10 blur-3xl" />
          <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                Real-time AI coding rooms
              </p>
              <h1 className="font-display max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-6xl">
                Pair with your team and AI in one live workspace.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
                Nexora is a MERN product: shared rooms, Socket.IO chat,{" "}
                <span className="text-gold">@ai</span> that generates a file tree,
                an editor, and in-browser Node via WebContainers.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-950 hover:bg-zinc-200"
                >
                  Create a room
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5"
                >
                  I already have an account
                </Link>
              </div>
              <p className="mt-6 max-w-xl text-xs leading-5 text-zinc-500">
                Wait for the pill to say Live, then sign in. First visit can take
                a few seconds while the API wakes.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-950 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-red-400/80" />
                <span className="h-2 w-2 rounded-full bg-amber-300/80" />
                <span className="h-2 w-2 rounded-full bg-tide/80" />
                <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  room · demo-todo
                </span>
              </div>
              <div className="grid grid-cols-[0.9fr_1.1fr] text-xs">
                <div className="border-r border-white/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-gold">Chat</p>
                  <p className="mt-3 rounded-lg bg-ink-700 px-2 py-1.5 text-zinc-300">
                    @ai create an Express homepage
                  </p>
                  <p className="mt-2 rounded-lg border border-tide/20 bg-ink-800 px-2 py-1.5 text-tide">
                    Generated server.js + package.json. Click Run.
                  </p>
                </div>
                <div className="p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-gold">Files</p>
                  <p className="mt-3 text-zinc-300">server.js</p>
                  <p className="text-zinc-500">package.json</p>
                  <div className="mt-4 rounded-lg bg-ink-800 px-2 py-3 font-mono text-[10px] leading-4 text-tide">
                    app.get("/", (req, res) =&gt; {"{"}
                    <br />
                    &nbsp;&nbsp;res.send("Nexora");
                    <br />
                    {"}"});
                  </div>
                  <p className="mt-3 inline-flex rounded-full bg-tide px-2 py-0.5 text-[10px] font-semibold text-ink-950">
                    Run
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
            What it can do
          </p>
          <h2 className="font-display mt-2 text-2xl font-bold">Capabilities, immediately obvious.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-white/10 bg-ink-800/80 p-5"
              >
                <i className={`${item.icon} text-xl text-gold`} />
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.n}
              className="rounded-2xl border border-white/10 bg-ink-800/80 p-6"
            >
              <p className="font-display text-sm text-gold">{step.n}</p>
              <h2 className="mt-3 font-display text-xl font-bold">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{step.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-3xl border border-white/10 bg-ink-800/50 p-8">
          <h2 className="font-display text-2xl font-bold">Try this first prompt</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            After you open a room, click a starter or paste this. Then press Run.
            That is the product.
          </p>
          <pre className="mt-5 overflow-auto rounded-2xl border border-gold/20 bg-ink-950 px-4 py-3 text-sm text-gold">
            {STARTERS[0].prompt}
          </pre>
          <div className="mt-6 flex flex-wrap gap-2">
            {stack.map((item) => (
              <span
                key={item}
                className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs text-gold"
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-zinc-500">
        Nexora · Live AI coding rooms · MERN · Socket.IO · WebContainers
      </footer>
    </div>
  );
}

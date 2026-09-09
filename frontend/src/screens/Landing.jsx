import { Link } from "react-router-dom";
import Brand from "../components/Brand";
import StatusPill from "../components/StatusPill";
import SkipLink from "../components/SkipLink";
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
    <div className="min-h-dvh bg-ink-950 text-zinc-100 grain">
      <SkipLink />
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6">
        <Brand />
        <div className="flex items-center gap-2 sm:gap-3">
          <StatusPill compact />
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center rounded-full px-3 text-sm text-zinc-300 hover:text-white sm:px-4"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex min-h-11 items-center rounded-full bg-gold px-3 text-sm font-semibold text-ink-950 hover:bg-amber-200 sm:px-4"
          >
            Get started
          </Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 px-5 py-10 sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-tide/10 blur-3xl" />
          <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-12">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                Real-time AI coding rooms
              </p>
              <h1 className="font-display max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                Pair with your team and AI in one live workspace.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
                Nexora is a MERN product: WhatsApp-style rooms (solo, 1:1, or group),
                live chat, a shared file workspace,{" "}
                <span className="text-gold">@ai</span> that generates code, and
                in-browser Node via WebContainers.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to="/register"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-950 hover:bg-zinc-200"
                >
                  Create a room
                </Link>
                <Link
                  to="/login"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5"
                >
                  I already have an account
                </Link>
              </div>
              <p className="mt-6 max-w-xl text-xs leading-5 text-zinc-400">
                Wait for the pill to say Live, then sign in. First visit can take
                a few seconds while the API wakes.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-950 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-red-400/80" aria-hidden />
                <span className="h-2 w-2 rounded-full bg-amber-300/80" aria-hidden />
                <span className="h-2 w-2 rounded-full bg-tide/80" aria-hidden />
                <span className="ml-2 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                  room · demo-todo
                </span>
              </div>
              <div className="grid text-xs sm:grid-cols-[0.9fr_1.1fr]">
                <div className="border-b border-white/10 p-3 sm:border-b-0 sm:border-r">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-gold">Chat</p>
                  <p className="mt-3 rounded-lg bg-ink-700 px-2 py-1.5 text-zinc-200">
                    @ai create an Express homepage
                  </p>
                  <p className="mt-2 rounded-lg border border-tide/20 bg-ink-800 px-2 py-1.5 text-tide">
                    Generated server.js + package.json. Click Run.
                  </p>
                </div>
                <div className="p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-gold">Files</p>
                  <p className="mt-3 text-zinc-200">server.js</p>
                  <p className="text-zinc-400">package.json</p>
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

        <section className="mt-12 sm:mt-16" aria-labelledby="capabilities-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
            What it can do
          </p>
          <h2 id="capabilities-heading" className="font-display mt-2 text-2xl font-bold">
            Capabilities, immediately obvious.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-white/10 bg-ink-800/80 p-5"
              >
                <i className={`${item.icon} text-xl text-gold`} aria-hidden />
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:mt-16 sm:gap-6 md:grid-cols-3" aria-label="How it works">
          {steps.map((step) => (
            <article
              key={step.n}
              className="rounded-2xl border border-white/10 bg-ink-800/80 p-6"
            >
              <p className="font-display text-sm text-gold">{step.n}</p>
              <h2 className="mt-3 font-display text-xl font-bold">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{step.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-ink-800/50 p-6 sm:mt-16 sm:p-8">
          <h2 className="font-display text-2xl font-bold">Try this first prompt</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
            After you open a room, tap a starter or paste this. Then press Run.
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

      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-zinc-400 sm:px-6">
        Nexora · Live AI coding rooms · MERN · Socket.IO · WebContainers · JWT rooms stay private to collaborators
      </footer>
    </div>
  );
}

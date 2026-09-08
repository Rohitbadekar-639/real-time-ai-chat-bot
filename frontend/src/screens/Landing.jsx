import { Link } from "react-router-dom";
import Brand from "../components/Brand";
import StatusPill from "../components/StatusPill";

const steps = [
  {
    n: "01",
    title: "Open a room",
    body: "Create a named workspace for a feature, interview prep session, or pair-programming hour.",
  },
  {
    n: "02",
    title: "Talk in real time",
    body: "Socket.IO keeps the conversation live. Invite collaborators without leaving the room.",
  },
  {
    n: "03",
    title: "Ask @ai to build",
    body: "The assistant returns an explanation plus a file tree. Edit it, then run it in the browser.",
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
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 px-6 py-16 sm:px-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-tide/10 blur-3xl" />
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-gold">
            MERN · Real-time · AI pair programmer
          </p>
          <h1 className="font-display max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Coding rooms where your team and AI ship together.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Nexora is not another chatbot. It is a live project room: chat with
            collaborators, generate a working file tree with <span className="text-gold">@ai</span>,
            edit it like an IDE, and run it in the browser.
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
            First visit may take a few seconds while the API wakes. The live
            pill above turns green when MongoDB is reachable — then login works.
          </p>
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
          <h2 className="font-display text-2xl font-bold">Built like a product, not a tutorial.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            JWT auth, Socket.IO rooms, persisted chat, an AI codegen contract that
            returns JSON file trees, and WebContainers for in-browser run. The
            same stack you would defend in a MERN interview.
          </p>
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
        Nexora · Real-time AI coding rooms · MERN production demo
      </footer>
    </div>
  );
}

import { Link } from "react-router-dom";
import Brand from "./Brand";
import StatusPill from "./StatusPill";
import SkipLink from "./SkipLink";
import { CAPABILITIES } from "../data/starters";

export default function AuthShell({ kicker, title, subtitle, children, footer }) {
  return (
    <div className="min-h-dvh bg-ink-950 md:grid md:grid-cols-2">
      <SkipLink />
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 px-10 py-10 grain md:flex">
        <div className="pointer-events-none absolute -right-16 top-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <Link to="/" className="w-fit" aria-label="Nexora home">
          <Brand />
        </Link>
        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
            Nexora workspace
          </p>
          <h1 className="font-display mt-4 text-4xl font-extrabold leading-tight text-white">
            A live coding room, not a chatbot.
          </h1>
          <ul className="mt-8 space-y-4">
            {CAPABILITIES.map((item) => (
              <li key={item.title} className="flex gap-3 text-sm text-zinc-300">
                <i className={`${item.icon} mt-0.5 text-gold`} aria-hidden />
                <span>
                  <span className="font-semibold text-zinc-100">{item.title}. </span>
                  {item.body}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <StatusPill />
      </aside>

      <section className="flex min-h-dvh flex-col px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-8 flex items-center justify-between gap-3 md:hidden">
          <Link to="/" aria-label="Nexora home">
            <Brand />
          </Link>
          <StatusPill compact />
        </div>
        <div id="main-content" className="mx-auto mt-2 w-full max-w-md pb-10 md:my-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
            {kicker}
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold text-white">{title}</h2>
          <p className="mt-2 text-sm text-zinc-300">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer}
        </div>
      </section>
    </div>
  );
}

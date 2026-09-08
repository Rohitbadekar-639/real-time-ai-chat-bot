import { Link } from "react-router-dom";
import Brand from "./Brand";
import StatusPill from "./StatusPill";
import { CAPABILITIES } from "../data/starters";

export default function AuthShell({ kicker, title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-ink-950 md:grid md:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 px-10 py-10 grain md:flex">
        <div className="pointer-events-none absolute -right-16 top-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <Link to="/">
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
              <li key={item.title} className="flex gap-3 text-sm text-zinc-400">
                <i className={`${item.icon} mt-0.5 text-gold`} />
                <span>
                  <span className="font-semibold text-zinc-200">{item.title}. </span>
                  {item.body}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <StatusPill />
      </aside>

      <section className="flex min-h-screen flex-col px-4 py-8 sm:px-8">
        <div className="mb-10 flex items-center justify-between md:hidden">
          <Link to="/">
            <Brand />
          </Link>
          <StatusPill />
        </div>
        <div className="mx-auto my-auto w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
            {kicker}
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold text-white">{title}</h2>
          <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer}
        </div>
      </section>
    </div>
  );
}

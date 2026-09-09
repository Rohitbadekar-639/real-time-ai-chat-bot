import { Link } from "react-router-dom";
import Brand from "../components/Brand";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-ink-950 px-6 text-center grain">
      <div className="max-w-md">
        <div className="mb-6 flex justify-center">
          <Brand />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">404</p>
        <h1 className="font-display mt-2 text-3xl font-bold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-zinc-400">
          That URL is not a Nexora room. Go home or sign in to your inbox.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-full bg-gold px-5 text-sm font-semibold text-ink-950"
          >
            Home
          </Link>
          <Link
            to="/app"
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white"
          >
            Open inbox
          </Link>
        </div>
      </div>
    </main>
  );
}

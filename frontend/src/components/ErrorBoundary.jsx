import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-dvh place-items-center bg-ink-950 px-6 text-center text-zinc-300">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
              Nexora
            </p>
            <h1 className="font-display mt-3 text-2xl font-bold text-white">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Reload the page. Your rooms and files are still saved on the server.
            </p>
            <button
              type="button"
              className="mt-6 min-h-11 rounded-full bg-gold px-5 text-sm font-semibold text-ink-950"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { UserContext } from "../context/user.context";
import Brand from "../components/Brand";
import StatusPill from "../components/StatusPill";
import { apiError } from "../config/apiError";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/app");
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    axios
      .post("/users/register", {
        email,
        password,
      })
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        navigate("/app");
      })
      .catch((err) => {
        setError(
          apiError(
            err,
            "Could not create the account. Try a different email, or wait if the server is waking up."
          )
        );
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="min-h-screen bg-ink-950 grain px-4 py-10">
      <div className="mx-auto mb-10 flex max-w-md items-center justify-between">
        <Link to="/">
          <Brand />
        </Link>
        <StatusPill />
      </div>
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-ink-800 p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
          New workspace
        </p>
        <h2 className="font-display mt-2 text-3xl font-bold text-white">Create account</h2>
        <p className="mt-2 text-sm text-zinc-400">
          One email. Then you can open a live coding room.
        </p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="mb-1.5 block text-xs text-zinc-400">
              Email
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-3 text-sm text-white outline-none ring-gold/40 placeholder:text-zinc-500 focus:ring-2"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs text-zinc-400">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={3}
              className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-3 text-sm text-white outline-none ring-gold/40 placeholder:text-zinc-500 focus:ring-2"
              placeholder="At least 3 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ink-950 hover:bg-amber-200 disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-gold hover:text-amber-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

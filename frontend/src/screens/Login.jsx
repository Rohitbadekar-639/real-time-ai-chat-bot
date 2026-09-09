import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/user.context";
import AuthShell from "../components/AuthShell";
import PasswordField from "../components/PasswordField";
import { apiError } from "../config/apiError";
import { authRequest } from "../config/authRequest";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/app");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    setSubmitting(true);
    try {
      const res = await authRequest(
        "post",
        "/users/login",
        { email, password },
        setStatus
      );
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      navigate("/app");
    } catch (err) {
      setStatus("");
      setError(
        apiError(
          err,
          "Could not sign in. If the server was sleeping, wait a few seconds and try again."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      kicker="Welcome back"
      title="Sign in"
      subtitle="Continue to your coding rooms."
      footer={
        <p className="mt-6 text-center text-sm text-zinc-400">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-gold hover:text-amber-200">
            Create one
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
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
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full rounded-xl border border-white/10 bg-ink-900 px-3 py-3 text-base text-white outline-none ring-gold/40 placeholder:text-zinc-500 focus-visible:ring-2 sm:text-sm"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {status && !error && (
          <p role="status" className="rounded-xl border border-gold/20 bg-gold/10 px-3 py-2 text-sm text-gold">
            {status}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="min-h-12 w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ink-950 hover:bg-amber-200 disabled:opacity-60"
        >
          {submitting ? "Please wait…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Login;

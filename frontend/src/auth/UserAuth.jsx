import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/user.context";
import { useNavigate } from "react-router-dom";
import axios from "../config/axios";

const UserAuth = ({ children }) => {
  const { user, setUser } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    let cancelled = false;

    if (!token) {
      setLoading(false);
      navigate("/login");
      return;
    }

    if (user) {
      setLoading(false);
      return;
    }

    async function loadProfile() {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
          const res = await axios.get("/users/profile");
          if (!cancelled) {
            setUser(res.data.user);
            setLoading(false);
          }
          return;
        } catch (err) {
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            if (!cancelled) {
              setUser(null);
              setLoading(false);
              navigate("/login");
            }
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
        }
      }
      if (!cancelled) setLoading(false);
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user, setUser, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ink-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
          <p className="text-sm">Opening your workspace…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ink-950 px-6 text-center text-zinc-400">
        <div>
          <p className="text-sm">The API is still waking up.</p>
          <button
            className="mt-4 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink-950"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default UserAuth;

import { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";
import Brand from "../components/Brand";
import StatusPill from "../components/StatusPill";
import { apiError } from "../config/apiError";
import { CAPABILITIES } from "../data/starters";
import { roomKind, roomSubtitle, roomTitle } from "../config/rooms";

const Home = () => {
  const { user, setUser } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDirectOpen, setIsDirectOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [project, setProject] = useState([]);
  const [people, setPeople] = useState([]);
  const [peopleQuery, setPeopleQuery] = useState("");
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  function logout() {
    axios.get("/users/logout").catch(() => {});
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  }

  function createProject(e) {
    e.preventDefault();
    setError("");

    axios
      .post("/projects/create", {
        name: projectName,
      })
      .then((response) => {
        const newProject = response.data;
        setProject((prevProjects) => [...prevProjects, newProject]);
        setIsModalOpen(false);
        setProjectName("");
        navigate(`/project`, { state: { project: newProject } });
      })
      .catch((err) => {
        setError(apiError(err, "Could not create that room. Try a unique name."));
      });
  }

  function loadPeople() {
    setLoadingPeople(true);
    axios
      .get("/users/all")
      .then((res) => setPeople(res.data.users || []))
      .catch(() => {})
      .finally(() => setLoadingPeople(false));
  }

  function openDirectPicker() {
    setPeopleQuery("");
    setIsDirectOpen(true);
    loadPeople();
  }

  function openDirect(otherUserId) {
    setError("");
    axios
      .post("/projects/direct", { userId: otherUserId })
      .then((res) => {
        setIsDirectOpen(false);
        navigate(`/project`, { state: { project: res.data } });
      })
      .catch((err) => {
        setError(apiError(err, "Could not open that chat."));
      });
  }

  useEffect(() => {
    axios
      .get("/projects/all")
      .then((res) => {
        setProject(res.data.projects || []);
      })
      .catch((err) => {
        setError(apiError(err, "Could not load chats. The API may still be waking up."));
      })
      .finally(() => setLoading(false));

    loadPeople();
    const onFocus = () => loadPeople();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (!isDirectOpen) return undefined;
    loadPeople();
    const tick = setInterval(loadPeople, 4000);
    return () => clearInterval(tick);
  }, [isDirectOpen]);

  return (
    <main className="min-h-screen bg-ink-950 grain text-zinc-100">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <Brand />
        <div className="flex items-center gap-3 text-sm">
          <StatusPill />
          <span className="hidden text-zinc-400 sm:inline">{user?.email}</span>
          <button
            onClick={logout}
            className="rounded-full border border-white/10 px-3 py-1.5 text-zinc-300 hover:bg-white/5"
          >
            Log out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
              Inbox
            </p>
            <h1 className="font-display mt-2 text-3xl font-bold">Chats & rooms</h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              WhatsApp-style conversations plus a shared VS Code-style workspace.
              Solo, one-to-one, or a group — everyone in the room sees chat and code live.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openDirectPicker}
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
            >
              Message someone
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink-950 hover:bg-amber-200"
            >
              New group room
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {String(error)}
          </p>
        )}

        {!loading && project.length === 0 && (
          <div className="mb-8 rounded-3xl border border-white/10 bg-ink-800/70 p-6">
            <p className="text-sm font-semibold text-white">How this works</p>
            <p className="mt-1 text-sm text-zinc-400">
              Message a person for a 1:1 thread, or create a named group. Inside,
              chat instantly and share the same files. @ai can generate a runnable app.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CAPABILITIES.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-ink-950 p-4">
                  <i className={`${item.icon} text-gold`} />
                  <p className="mt-2 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading && (
            <div className="rounded-2xl border border-white/10 p-6 text-sm text-zinc-500">
              Loading conversations…
            </div>
          )}
          {project.map((item) => {
            const kind = roomKind(item);
            const title = roomTitle(item, user?.email);
            const count = item.users?.length || 0;
            return (
              <button
                key={item._id}
                onClick={() => {
                  navigate(`/project`, { state: { project: item } });
                }}
                className="rounded-2xl border border-white/10 bg-ink-800 p-6 text-left transition hover:border-gold/40 hover:bg-ink-700"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
                  {kind === "direct" ? "Direct" : kind === "solo" ? "Solo" : "Group"}
                </p>
                <h2 className="mt-2 truncate font-semibold">{title}</h2>
                <p className="mt-2 text-xs text-zinc-400">{roomSubtitle(kind, count)}</p>
              </button>
            );
          })}
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-800 p-6 shadow-2xl">
            <h2 className="font-display text-xl font-semibold">New group room</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Start solo, then invite people. Chat and files are shared with everyone in the room.
            </p>
            <form onSubmit={createProject} className="mt-4">
              <label htmlFor="projectName" className="block text-sm text-zinc-400">
                Room name
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-gold/40"
                required
              />
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-200 hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-amber-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDirectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-800 p-6 shadow-2xl">
            <h2 className="font-display text-xl font-semibold">Message someone</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Newest accounts show first. Search if the list is long.
            </p>
            <input
              value={peopleQuery}
              onChange={(e) => setPeopleQuery(e.target.value)}
              placeholder="Search email"
              className="mt-3 w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold/40"
            />
            <div className="mt-3 max-h-80 space-y-1 overflow-auto">
              {loadingPeople && (
                <p className="px-1 text-sm text-zinc-500">Refreshing users…</p>
              )}
              {people
                .filter((person) => {
                  if (person.email === user?.email) return false;
                  if (String(person._id) === String(user?._id)) return false;
                  if (
                    peopleQuery &&
                    !String(person.email || "")
                      .toLowerCase()
                      .includes(peopleQuery.toLowerCase())
                  ) {
                    return false;
                  }
                  return true;
                })
                .map((person) => (
                <button
                  key={person._id}
                  onClick={() => openDirect(person._id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-ink-700"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-ink-700 text-gold">
                    <i className="ri-user-line" />
                  </span>
                  <span className="text-sm">{person.email}</span>
                </button>
              ))}
              {!loadingPeople && people.length === 0 && (
                <p className="px-1 text-sm text-zinc-500">
                  No other accounts yet. Ask someone to register, then message them here.
                </p>
              )}
            </div>
            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={() => setIsDirectOpen(false)}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-200 hover:bg-white/15"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;

import { useContext, useState, useEffect, useCallback } from "react";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";
import Brand from "../components/Brand";
import StatusPill from "../components/StatusPill";
import SkipLink from "../components/SkipLink";
import Modal from "../components/Modal";
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

  const loadPeople = useCallback(() => {
    setLoadingPeople(true);
    axios
      .get("/users/all")
      .then((res) => setPeople(res.data.users || []))
      .catch(() => {})
      .finally(() => setLoadingPeople(false));
  }, []);

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
  }, []);

  useEffect(() => {
    if (!isDirectOpen) return undefined;
    loadPeople();
    const tick = setInterval(loadPeople, 8000);
    const onFocus = () => loadPeople();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(tick);
      window.removeEventListener("focus", onFocus);
    };
  }, [isDirectOpen, loadPeople]);

  const visiblePeople = people.filter((person) => {
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
  });

  return (
    <main className="min-h-dvh bg-ink-950 grain text-zinc-100">
      <SkipLink />
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-ink-950/90 px-4 py-3 backdrop-blur sm:px-6">
        <Brand />
        <div className="flex min-w-0 items-center gap-2 text-sm sm:gap-3">
          <StatusPill compact />
          <span className="hidden truncate text-zinc-400 md:inline">{user?.email}</span>
          <button
            onClick={logout}
            className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-3 py-1.5 text-zinc-200 hover:bg-white/5"
          >
            Log out
          </button>
        </div>
      </header>

      <section id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
              Inbox
            </p>
            <h1 className="font-display mt-2 text-3xl font-bold">Chats & rooms</h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-300">
              WhatsApp-style conversations plus a shared workspace. Solo, one-to-one,
              or a group — everyone in the room sees chat and code live.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <button
              onClick={openDirectPicker}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white hover:bg-white/5"
            >
              Message someone
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold text-ink-950 hover:bg-amber-200"
            >
              New group room
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {String(error)}
          </p>
        )}

        {!loading && project.length === 0 && (
          <div className="mb-8 rounded-3xl border border-white/10 bg-ink-800/70 p-5 sm:p-6">
            <p className="text-sm font-semibold text-white">How this works</p>
            <p className="mt-1 text-sm text-zinc-300">
              Message a person for a 1:1 thread, or create a named group. Inside,
              chat instantly and share the same files. @ai can generate a runnable app.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CAPABILITIES.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-ink-950 p-4">
                  <i className={`${item.icon} text-gold`} aria-hidden />
                  <p className="mt-2 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {loading && (
            <div className="rounded-2xl border border-white/10 p-6 text-sm text-zinc-400">
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
                className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-white/10 bg-ink-800 p-4 text-left transition hover:border-gold/40 hover:bg-ink-700 sm:block sm:p-6"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink-700 text-gold sm:hidden">
                  <i
                    className={
                      kind === "direct"
                        ? "ri-user-line"
                        : kind === "solo"
                          ? "ri-user-smile-line"
                          : "ri-group-line"
                    }
                    aria-hidden
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
                    {kind === "direct" ? "Direct" : kind === "solo" ? "Solo" : "Group"}
                  </p>
                  <h2 className="mt-1 truncate font-semibold sm:mt-2">{title}</h2>
                  <p className="mt-1 text-xs text-zinc-400 sm:mt-2">{roomSubtitle(kind, count)}</p>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {isModalOpen && (
        <Modal
          title="New group room"
          description="Start solo, then invite people. Chat and files are shared with everyone in the room."
          onClose={() => setIsModalOpen(false)}
          footer={null}
        >
          <form onSubmit={createProject}>
            <label htmlFor="projectName" className="block text-sm text-zinc-300">
              Room name
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-3 text-base text-white outline-none focus-visible:ring-2 focus-visible:ring-gold/40 sm:text-sm"
              required
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="min-h-11 rounded-xl bg-white/10 px-4 py-2 text-sm text-zinc-200 hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-11 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-amber-200"
              >
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {isDirectOpen && (
        <Modal
          title="Message someone"
          description="Newest accounts show first. Search if the list is long."
          onClose={() => setIsDirectOpen(false)}
        >
          <label htmlFor="people-search" className="sr-only">
            Search people by email
          </label>
          <input
            id="people-search"
            value={peopleQuery}
            onChange={(e) => setPeopleQuery(e.target.value)}
            placeholder="Search email"
            className="w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-gold/40 sm:text-sm"
          />
          <div className="mt-3 max-h-[50vh] space-y-1 overflow-auto">
            {loadingPeople && (
              <p className="px-1 text-sm text-zinc-400">Refreshing users…</p>
            )}
            {visiblePeople.map((person) => (
              <button
                key={person._id}
                onClick={() => openDirect(person._id)}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-ink-700"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ink-700 text-gold">
                  <i className="ri-user-line" aria-hidden />
                </span>
                <span className="truncate text-sm">{person.email}</span>
              </button>
            ))}
            {!loadingPeople && people.length === 0 && (
              <p className="px-1 text-sm text-zinc-400">
                No other accounts yet. Ask someone to register, then message them here.
              </p>
            )}
            {!loadingPeople && people.length > 0 && visiblePeople.length === 0 && (
              <p className="px-1 text-sm text-zinc-400">No matching accounts.</p>
            )}
          </div>
        </Modal>
      )}
    </main>
  );
};

export default Home;

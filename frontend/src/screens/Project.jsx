import React, { useState, useEffect, useContext, useRef } from "react";
import { UserContext } from "../context/user.context";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
  disconnectSocket,
} from "../config/socket";
import Markdown from "markdown-to-jsx";
import hljs from "highlight.js";
import "highlight.js/styles/nord.css";
import { getWebContainer } from "../config/webContainer";
import Brand from "../components/Brand";
import StatusPill from "../components/StatusPill";
import { STARTERS } from "../data/starters";
import { roomKind, roomTitle } from "../config/rooms";

function SyntaxHighlightedCode(props) {
  const ref = useRef(null);

  React.useEffect(() => {
    if (ref.current && props.className?.includes("lang-") && window.hljs) {
      window.hljs.highlightElement(ref.current);
      ref.current.removeAttribute("data-highlighted");
    }
  }, [props.className, props.children]);

  return <code {...props} ref={ref} />;
}

function langFromFile(name = "") {
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".html") || name.endsWith(".xml")) return "xml";
  if (name.endsWith(".css")) return "css";
  if (name.endsWith(".md")) return "markdown";
  return "javascript";
}

function highlightCode(filename, source) {
  const code = source || "";
  try {
    return hljs.highlight(code, { language: langFromFile(filename) }).value;
  } catch {
    return hljs.highlightAuto(code).value;
  }
}

const Project = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [project, setProject] = useState(location.state?.project);
  const [message, setMessage] = useState("");
  const { user } = useContext(UserContext);
  const messageBox = useRef(null);
  const logBox = useRef(null);

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [fileTree, setFileTree] = useState({});

  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);

  const [webContainer, setWebContainer] = useState(null);
  const webContainerRef = useRef(null);
  const [iframeUrl, setIframeUrl] = useState(null);

  const [runProcess, setRunProcess] = useState(null);
  const [runHint, setRunHint] = useState("");
  const [runLogs, setRunLogs] = useState("");
  const [running, setRunning] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimer = useRef(null);
  const applyingRemoteTree = useRef(false);

  const hasFiles = Object.keys(fileTree).length > 0;

  const handleUserClick = (id) => {
    setSelectedUserId((prevSelectedUserId) => {
      const newSelectedUserId = new Set(prevSelectedUserId);
      if (newSelectedUserId.has(id)) {
        newSelectedUserId.delete(id);
      } else {
        newSelectedUserId.add(id);
      }
      return newSelectedUserId;
    });
  };

  function addCollaborators() {
    axios
      .put("/projects/add-user", {
        projectId: location.state.project._id,
        users: Array.from(selectedUserId),
      })
      .then(() => axios.get(`/projects/get-project/${location.state.project._id}`))
      .then((res) => {
        if (res.data?.project) setProject(res.data.project);
        setIsModalOpen(false);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function applyFileTree(tree, { persistRemote = false } = {}) {
    if (!tree || typeof tree !== "object") return;
    applyingRemoteTree.current = persistRemote;
    setFileTree(tree);
    webContainerRef.current?.mount(tree);
    const preferred =
      Object.keys(tree).find((name) =>
        /server\.js|app\.js|index\.js|index\.html/i.test(name)
      ) || Object.keys(tree)[0];
    if (preferred) {
      setCurrentFile(preferred);
      setOpenFiles((prev) => [...new Set([...prev, preferred])]);
    }
  }

  function sendPrompt(text) {
    const next = String(text || "").trim();
    if (!next) return;
    sendMessage("project-message", {
      message: next,
      sender: user,
    });
    if (next.includes("@ai")) {
      setAiBusy(true);
    }
    setMessages((prevMessages) => [...prevMessages, { sender: user, message: next }]);
    sendMessage("typing", { typing: false });
  }

  const send = () => {
    sendPrompt(message);
    setMessage("");
  };

  function WriteAiMessage(raw) {
    let messageObject = { text: raw };
    try {
      messageObject = JSON.parse(raw);
    } catch {
      messageObject = { text: raw };
    }

    return (
      <div className="overflow-auto rounded-xl bg-ink-950 p-3 text-tide">
        <Markdown
          children={messageObject.text}
          options={{
            overrides: {
              code: SyntaxHighlightedCode,
            },
          }}
        />
      </div>
    );
  }

  function appendLog(chunk) {
    const text = typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk);
    setRunLogs((prev) => (prev + text).slice(-12000));
  }

  function closeFile(file) {
    setOpenFiles((prev) => {
      const next = prev.filter((name) => name !== file);
      if (currentFile === file) {
        setCurrentFile(next[0] || null);
      }
      return next;
    });
  }

  async function runWorkspace() {
    if (!webContainer) {
      setRunHint("WebContainer is not ready in this browser yet. Use Chrome.");
      return;
    }
    if (!fileTree["package.json"]) {
      setRunHint("This workspace needs a package.json with a start script. Use a starter prompt.");
      return;
    }

    setRunning(true);
    setRunHint("Installing dependencies…");
    setRunLogs("npm install\n");
    setIframeUrl(null);

    try {
      await webContainer.mount(fileTree);

      const installProcess = await webContainer.spawn("npm", ["install"]);
      installProcess.output.pipeTo(
        new WritableStream({
          write(chunk) {
            appendLog(chunk);
          },
        })
      );
      await installProcess.exit;

      if (runProcess) {
        runProcess.kill();
      }

      setRunHint("Starting… click around the preview when it appears.");
      const tempRunProcess = await webContainer.spawn("npm", ["start"]);
      tempRunProcess.output.pipeTo(
        new WritableStream({
          write(chunk) {
            appendLog(chunk);
          },
        })
      );
      setRunProcess(tempRunProcess);
      setShowPreview(true);

      webContainer.on("server-ready", (port, url) => {
        setIframeUrl(url);
        setRunHint(`Preview is live on port ${port}.`);
      });
    } catch (err) {
      console.log(err);
      setRunHint("Run failed. Chat and file editing still work.");
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    if (!location.state?.project) {
      navigate("/app");
      return;
    }

    initializeSocket(project._id);

    if (!webContainer) {
      getWebContainer()
        .then((container) => {
          webContainerRef.current = container;
          setWebContainer(container);
        })
        .catch((err) => {
          console.log(err);
          setRunHint("In-browser run needs a Chromium browser. Chat and AI still work.");
        });
    }

    receiveMessage("room-presence", (members) => {
      if (Array.isArray(members)) setOnlineUsers(members);
    });

    receiveMessage("typing", (payload) => {
      const email = payload?.email;
      if (!email || email === user?.email) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (payload.typing) next.add(email);
        else next.delete(email);
        return [...next];
      });
    });

    receiveMessage("file-tree-update", (payload) => {
      if (!payload?.fileTree) return;
      if (String(payload.sender?._id) === String(user?._id)) return;
      applyFileTree(payload.fileTree, { persistRemote: true });
      const who = payload.sender?._id === "ai" ? "AI" : payload.sender?.email || "A teammate";
      setRunHint(`${who} updated the shared files.`);
    });

    receiveMessage("message-history", (history) => {
      if (Array.isArray(history)) {
        setMessages(history);
      }
    });

    receiveMessage("project-message", (data) => {
      if (data.sender._id == "ai") {
        setAiBusy(false);
        try {
          const parsed = JSON.parse(data.message);

          if (parsed.fileTree) {
            applyFileTree(parsed.fileTree);
            setRunHint("Files ready. Everyone in this chat can see them. Click Run.");
            axios
              .put("/projects/update-file-tree", {
                projectId: location.state.project._id,
                fileTree: parsed.fileTree,
              })
              .catch(() => {});
          }
        } catch (err) {
          console.log(err);
        }
        setMessages((prevMessages) => [...prevMessages, data]);
      } else {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    });

    axios
      .get(`/projects/get-project/${location.state.project._id}`)
      .then((res) => {
        setProject(res.data.project);
        const tree = res.data.project.fileTree || {};
        setFileTree(tree);
        const firstFile = Object.keys(tree)[0];
        if (firstFile) {
          setCurrentFile(firstFile);
          setOpenFiles([firstFile]);
        }
      });

    axios
      .get("/users/all")
      .then((res) => {
        setUsers(res.data.users);
      })
      .catch((err) => {
        console.log(err);
      });

    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (messageBox.current) {
      messageBox.current.scrollTop = messageBox.current.scrollHeight;
    }
  }, [messages, aiBusy]);

  useEffect(() => {
    if (logBox.current) {
      logBox.current.scrollTop = logBox.current.scrollHeight;
    }
  }, [runLogs]);

  function saveFileTree(ft) {
    axios
      .put("/projects/update-file-tree", {
        projectId: project._id,
        fileTree: ft,
      })
      .catch((err) => {
        console.log(err);
      });
    if (!applyingRemoteTree.current) {
      sendMessage("file-tree-update", { fileTree: ft });
    }
    applyingRemoteTree.current = false;
  }

  if (!project) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-950 text-zinc-400">
        Returning to rooms…
      </div>
    );
  }

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-ink-950 text-zinc-100">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-ink-900 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={() => navigate("/app")} className="shrink-0">
            <Brand compact />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {roomTitle(project, user?.email)}
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              {roomKind(project) === "direct"
                ? "Direct chat"
                : roomKind(project) === "solo"
                  ? "Solo workspace"
                  : "Group room"}
              {onlineUsers.length
                ? ` · ${onlineUsers.length} online`
                : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill />
          <button
            className="hidden rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 sm:inline"
            onClick={() => setIsModalOpen(true)}
          >
            Invite
          </button>
          <button
            onClick={() => setIsSidePanelOpen(true)}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
          >
            People
          </button>
          <button
            onClick={() => navigate("/app")}
            className="rounded-full px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
          >
            Rooms
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="relative flex h-full w-[22rem] shrink-0 flex-col border-r border-white/10 bg-ink-800">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
              Live chat
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Instant messages with everyone here. Files on the right stay in sync.
            </p>
          </div>
          <div
            ref={messageBox}
            className="nexora-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3"
          >
            {messages.length === 0 && !aiBusy && (
              <div className="rounded-2xl border border-white/10 bg-ink-950 p-4">
                <p className="text-sm font-semibold">What to do in this room</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-5 text-zinc-400">
                  <li>Chat here like WhatsApp — others in the room see it instantly</li>
                  <li>Click a starter or type @ai to generate shared files</li>
                  <li>Edit code together, then press Run</li>
                </ol>
              </div>
            )}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex w-fit max-w-[95%] flex-col rounded-2xl p-2 ${
                  msg.sender._id === "ai"
                    ? "border border-tide/20 bg-ink-950"
                    : msg.sender._id == user?._id?.toString()
                      ? "ml-auto bg-gold/15"
                      : "bg-ink-700"
                }`}
              >
                <small className="px-1 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  {msg.sender._id === "ai" ? "Nexora AI" : msg.sender.email}
                </small>
                <div className="mt-1 text-sm">
                  {msg.sender._id === "ai" ? (
                    WriteAiMessage(msg.message)
                  ) : (
                    <p className="px-1 py-0.5">{msg.message}</p>
                  )}
                </div>
              </div>
            ))}
            {aiBusy && (
              <div className="w-fit rounded-2xl border border-tide/20 bg-ink-950 p-3">
                <small className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Nexora AI
                </small>
                <p className="mt-1 text-sm text-tide">Generating a workspace…</p>
              </div>
            )}
            {typingUsers.length > 0 && (
              <p className="px-1 text-xs text-zinc-500">
                {typingUsers.join(", ")} typing…
              </p>
            )}
          </div>

          <div className="border-t border-white/10 p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {STARTERS.map((starter) => (
                <button
                  key={starter.id}
                  onClick={() => sendPrompt(starter.prompt)}
                  disabled={aiBusy}
                  className="rounded-full border border-gold/20 bg-gold/5 px-2.5 py-1 text-[11px] text-gold hover:bg-gold/10 disabled:opacity-50"
                >
                  {starter.title}
                </button>
              ))}
            </div>
            <div className="flex overflow-hidden rounded-xl border border-white/10">
              <input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  sendMessage("typing", { typing: true });
                  if (typingTimer.current) clearTimeout(typingTimer.current);
                  typingTimer.current = setTimeout(() => {
                    sendMessage("typing", { typing: false });
                  }, 1200);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    send();
                  }
                }}
                className="flex-grow bg-ink-900 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500"
                type="text"
                placeholder="Message this chat · @ai to generate code"
              />
              <button onClick={send} className="bg-gold px-4 text-ink-950">
                <i className="ri-send-plane-fill"></i>
              </button>
            </div>
          </div>

          <div
            className={`absolute inset-0 z-20 flex flex-col bg-ink-800 transition-transform ${
              isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h1 className="text-sm font-semibold">Collaborators</h1>
              <button onClick={() => setIsSidePanelOpen(false)} className="p-1 text-zinc-400">
                <i className="ri-close-fill text-lg"></i>
              </button>
            </header>
            <div className="flex flex-col gap-1 p-2">
              {project.users &&
                project.users.map((collaborator) => (
                  <div
                    key={collaborator._id || collaborator.email}
                    className="flex items-center gap-2 rounded-xl p-2"
                  >
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-ink-700 text-gold">
                      <i className="ri-user-fill"></i>
                    </div>
                    <p className="text-sm">{collaborator.email}</p>
                    {onlineUsers.some(
                      (member) =>
                        member.email === collaborator.email ||
                        String(member._id) === String(collaborator._id)
                    ) && (
                      <span className="ml-auto text-[10px] uppercase tracking-[0.14em] text-tide">
                        Online
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </section>

        <section className="flex min-w-0 flex-1 bg-ink-900">
          <div className="h-full w-52 shrink-0 border-r border-white/10 bg-ink-800">
            <div className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Files
            </div>
            {!hasFiles && (
              <p className="px-4 text-xs leading-5 text-zinc-500">
                Generated files land here after @ai.
              </p>
            )}
            {Object.keys(fileTree).map((file) => (
              <button
                key={file}
                onClick={() => {
                  setCurrentFile(file);
                  setOpenFiles([...new Set([...openFiles, file])]);
                }}
                className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${
                  currentFile === file ? "bg-ink-700 text-gold" : "text-zinc-300 hover:bg-ink-700"
                }`}
              >
                <i className="ri-file-code-line text-zinc-500" />
                <span className="truncate">{file}</span>
              </button>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-white/10">
              <div className="flex min-w-0 overflow-auto">
                {openFiles.map((file) => (
                  <div
                    key={file}
                    className={`flex items-center border-r border-white/5 ${
                      currentFile === file ? "bg-ink-700 text-gold" : "text-zinc-400"
                    }`}
                  >
                    <button
                      onClick={() => setCurrentFile(file)}
                      className="px-3 py-2 text-sm"
                    >
                      {file}
                    </button>
                    <button
                      onClick={() => closeFile(file)}
                      className="pr-2 text-zinc-500 hover:text-white"
                      aria-label={`Close ${file}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3">
                {iframeUrl && (
                  <button
                    onClick={() => setShowPreview((value) => !value)}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    {showPreview ? "Hide preview" : "Show preview"}
                  </button>
                )}
                <button
                  onClick={runWorkspace}
                  disabled={running}
                  className="rounded-lg bg-tide px-4 py-1.5 text-sm font-semibold text-ink-950 hover:bg-teal-200 disabled:opacity-60"
                >
                  {running ? "Running…" : "Run"}
                </button>
              </div>
            </div>

            {runHint && (
              <p className="border-b border-white/10 px-4 py-2 text-xs text-gold">{runHint}</p>
            )}

            <div className="flex min-h-0 flex-1">
              <div className="flex min-w-0 flex-1 flex-col">
                {!hasFiles ? (
                  <div className="flex flex-1 flex-col justify-center gap-4 px-8">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                        Empty workspace
                      </p>
                      <h2 className="font-display mt-2 text-2xl font-bold">
                        Generate a Node app, then Run it here.
                      </h2>
                      <p className="mt-2 max-w-lg text-sm text-zinc-400">
                        WebContainers run Node in the browser. Use a starter so
                        recruiters see files, an editor, and a live preview.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {STARTERS.map((starter) => (
                        <button
                          key={starter.id}
                          onClick={() => sendPrompt(starter.prompt)}
                          disabled={aiBusy}
                          className="rounded-2xl border border-white/10 bg-ink-800 p-4 text-left hover:border-gold/40 disabled:opacity-50"
                        >
                          <p className="text-[10px] uppercase tracking-[0.16em] text-gold">
                            {starter.hint}
                          </p>
                          <p className="mt-2 font-semibold">{starter.title}</p>
                          <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-500">
                            {starter.prompt}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : fileTree[currentFile] ? (
                  <div className="code-editor-area min-h-0 flex-1 overflow-auto bg-ink-950">
                    <pre className="hljs h-full">
                      <code
                        className="hljs h-full outline-none"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updatedContent = e.target.innerText;
                          const ft = {
                            ...fileTree,
                            [currentFile]: {
                              file: {
                                contents: updatedContent,
                              },
                            },
                          };
                          setFileTree(ft);
                          saveFileTree(ft);
                        }}
                        dangerouslySetInnerHTML={{
                          __html: highlightCode(
                            currentFile,
                            fileTree[currentFile].file.contents
                          ),
                        }}
                        style={{
                          whiteSpace: "pre-wrap",
                          padding: "1.25rem",
                          paddingBottom: "8rem",
                        }}
                      />
                    </pre>
                  </div>
                ) : (
                  <div className="grid flex-1 place-items-center text-sm text-zinc-500">
                    Select a file from the tree.
                  </div>
                )}

                {(runLogs || running) && (
                  <div className="h-36 shrink-0 border-t border-white/10 bg-black/40">
                    <p className="px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      Run console
                    </p>
                    <pre
                      ref={logBox}
                      className="nexora-scroll h-[7.2rem] overflow-auto px-3 pb-3 font-mono text-[11px] leading-4 text-zinc-400"
                    >
                      {runLogs || "Waiting for npm…"}
                    </pre>
                  </div>
                )}
              </div>

              {showPreview && iframeUrl && webContainer && (
                <div className="flex w-[26rem] shrink-0 flex-col border-l border-white/10">
                  <input
                    type="text"
                    onChange={(e) => setIframeUrl(e.target.value)}
                    value={iframeUrl}
                    className="border-b border-white/10 bg-ink-800 px-3 py-2 text-xs"
                  />
                  <iframe title="Nexora preview" src={iframeUrl} className="h-full w-full bg-white" />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="relative w-96 max-w-full rounded-2xl border border-white/10 bg-ink-800 p-4">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Invite to this room</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2">
                <i className="ri-close-fill"></i>
              </button>
            </header>
            <p className="mb-3 text-xs text-zinc-400">
              Add an existing Nexora account. They will see this room in their workspace.
            </p>
            <div className="users-list mb-16 flex max-h-96 flex-col gap-2 overflow-auto">
              {users.map((listedUser) => (
                <div
                  key={listedUser._id}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl p-2 hover:bg-ink-700 ${
                    Array.from(selectedUserId).indexOf(listedUser._id) != -1
                      ? "bg-ink-700"
                      : ""
                  }`}
                  onClick={() => handleUserClick(listedUser._id)}
                >
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-ink-700 text-gold">
                    <i className="ri-user-fill"></i>
                  </div>
                  <h1 className="text-sm font-semibold">{listedUser.email}</h1>
                </div>
              ))}
              {users.length === 0 && (
                <p className="px-2 text-sm text-zinc-500">No other users yet.</p>
              )}
            </div>
            <button
              onClick={addCollaborators}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-ink-950"
            >
              Add collaborators
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;

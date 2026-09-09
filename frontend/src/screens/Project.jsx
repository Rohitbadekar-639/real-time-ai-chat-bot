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
import "highlight.js/styles/nord.css";
import { getWebContainer } from "../config/webContainer";
import Brand from "../components/Brand";
import StatusPill from "../components/StatusPill";
import SkipLink from "../components/SkipLink";
import Modal from "../components/Modal";
import CodeEditor from "../components/CodeEditor";
import "../config/highlight";
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

function attachmentSrc(attachment) {
  if (!attachment?.data) return "";
  if (String(attachment.data).startsWith("data:")) return attachment.data;
  return `data:${attachment.mime};base64,${attachment.data}`;
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
  const [userQuery, setUserQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
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
  const [mobilePane, setMobilePane] = useState("chat");
  const typingTimer = useRef(null);
  const applyingRemoteTree = useRef(false);
  const saveTimer = useRef(null);
  const fileInput = useRef(null);
  const [attachError, setAttachError] = useState("");

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

  function loadUsers() {
    setLoadingUsers(true);
    axios
      .get("/users/all")
      .then((res) => {
        setUsers(res.data.users || []);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => setLoadingUsers(false));
  }

  function openInvite() {
    setSelectedUserId(new Set());
    setUserQuery("");
    setIsModalOpen(true);
    loadUsers();
  }

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

  function sendPrompt(text, extra = {}) {
    const next = String(text || "").trim();
    const attachment = extra.attachment;
    if (!next && !attachment) return;
    if (next.includes("@ai") && aiBusy) return;
    sendMessage("project-message", {
      message: next || (attachment ? "Shared an image." : ""),
      sender: user,
      ...(attachment ? { attachment } : {}),
    });
    if (next.includes("@ai") && !attachment) {
      setAiBusy(true);
    }
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        sender: user,
        message: next || (attachment ? "Shared an image." : ""),
        ...(attachment ? { attachment } : {}),
      },
    ]);
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

    if (!webContainer && !window.matchMedia("(max-width: 767px)").matches) {
      getWebContainer()
        .then((container) => {
          webContainerRef.current = container;
          setWebContainer(container);
        })
        .catch((err) => {
          console.log(err);
          setRunHint("In-browser run needs a Chromium browser. Chat and AI still work.");
        });
    } else if (window.matchMedia("(max-width: 767px)").matches) {
      setRunHint("On a phone you can chat and edit files. Open Chrome on desktop to Run a live preview.");
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

    const onFocus = () => {
      if (isModalOpen) loadUsers();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (!isModalOpen) return undefined;
    loadUsers();
    const tick = setInterval(loadUsers, 8000);
    return () => clearInterval(tick);
  }, [isModalOpen]);

  useEffect(() => {
    if (!isSidePanelOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setIsSidePanelOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isSidePanelOpen]);

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

  function updateFileContents(contents) {
    if (!currentFile) return;
    setFileTree((prev) => {
      const ft = {
        ...prev,
        [currentFile]: {
          file: { contents },
        },
      };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveFileTree(ft), 700);
      return ft;
    });
  }

  function shareImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setAttachError("");
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) {
      setAttachError("Use a JPG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > 520 * 1024) {
      setAttachError("Keep images under 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      sendPrompt(message, {
        attachment: {
          kind: "image",
          name: file.name,
          mime: file.type,
          data: reader.result,
        },
      });
      setMessage("");
    };
    reader.readAsDataURL(file);
  }

  if (!project) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ink-950 text-zinc-400">
        Returning to rooms…
      </div>
    );
  }

  const inviteCandidates = users.filter((listedUser) => {
    if (listedUser.email === user?.email) return false;
    if (String(listedUser._id) === String(user?._id)) return false;
    if (
      userQuery &&
      !String(listedUser.email || "")
        .toLowerCase()
        .includes(userQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <main className="workspace-shell flex w-full flex-col bg-ink-950 text-zinc-100">
      <SkipLink href="#room-content" />
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-ink-900 px-2 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate("/app")}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
            aria-label="Back to rooms"
          >
            <Brand compact />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">
              {roomTitle(project, user?.email)}
            </h1>
            <p className="truncate text-[10px] uppercase tracking-[0.18em] text-zinc-400">
              {roomKind(project) === "direct"
                ? "Direct chat"
                : roomKind(project) === "solo"
                  ? "Solo workspace"
                  : "Group room"}
              {onlineUsers.length ? ` · ${onlineUsers.length} online` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <StatusPill compact />
          <button
            className="inline-flex h-11 items-center rounded-full border border-white/10 px-3 text-xs text-zinc-200 hover:bg-white/5"
            onClick={openInvite}
          >
            <i className="ri-user-add-line mr-0 sm:mr-1.5" aria-hidden />
            <span className="hidden sm:inline">Invite</span>
            <span className="sr-only sm:hidden">Invite people</span>
          </button>
          <button
            onClick={() => setIsSidePanelOpen(true)}
            className="inline-flex h-11 items-center rounded-full border border-white/10 px-3 text-xs text-zinc-200 hover:bg-white/5"
          >
            People
          </button>
          <button
            onClick={() => navigate("/app")}
            className="hidden h-11 items-center rounded-full px-3 text-xs text-zinc-400 hover:text-white sm:inline-flex"
          >
            Rooms
          </button>
        </div>
      </header>

      <div id="room-content" className="flex min-h-0 flex-1">
        <section
          className={`${
            mobilePane === "chat" ? "flex" : "hidden"
          } relative h-full min-h-0 w-full shrink-0 flex-col border-r border-white/10 bg-ink-800 lg:flex lg:w-[22rem]`}
          aria-label="Live chat"
        >
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
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-5 text-zinc-300">
                  <li>Chat here like WhatsApp — others in the room see it instantly</li>
                  <li>Tap a starter or type @ai to generate shared files</li>
                  <li>Edit code together, then press Run on desktop Chrome</li>
                </ol>
              </div>
            )}
            {hasFiles && (
              <button
                type="button"
                onClick={() => setMobilePane("workspace")}
                className="rounded-xl border border-gold/20 bg-gold/10 px-3 py-2 text-left text-xs text-gold lg:hidden"
              >
                Files are ready. Open the Code tab to edit and run.
              </button>
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
                    <>
                      {msg.attachment?.kind === "image" && (
                        <img
                          src={attachmentSrc(msg.attachment)}
                          alt={msg.attachment.name || "Shared image"}
                          className="mb-1 max-h-56 max-w-full rounded-lg"
                        />
                      )}
                      {msg.message && msg.message !== "Shared an image." && (
                        <p className="px-1 py-0.5">{msg.message}</p>
                      )}
                    </>
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
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={shareImage}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="grid min-w-11 place-items-center bg-ink-900 text-zinc-300 hover:text-gold"
                aria-label="Attach an image"
              >
                <i className="ri-image-line" aria-hidden />
              </button>
              <label htmlFor="room-message" className="sr-only">
                Message this chat
              </label>
              <input
                id="room-message"
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
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send();
                  }
                }}
                className="min-h-11 flex-grow bg-ink-900 px-3 py-2.5 text-base outline-none placeholder:text-zinc-400 sm:text-sm"
                type="text"
                placeholder="Message this chat · @ai to generate code"
              />
              <button
                onClick={send}
                className="min-w-12 bg-gold px-4 text-ink-950"
                aria-label="Send message"
              >
                <i className="ri-send-plane-fill" aria-hidden />
              </button>
            </div>
            {attachError && (
              <p role="alert" className="mt-1 text-xs text-red-300">
                {attachError}
              </p>
            )}
          </div>
        </section>

        <section
          className={`${
            mobilePane === "workspace" || mobilePane === "preview" ? "flex" : "hidden"
          } min-w-0 flex-1 flex-col bg-ink-900 lg:flex lg:flex-row`}
          aria-label="Code workspace"
        >
          <div
            className={`${
              mobilePane === "preview" ? "hidden lg:flex" : "flex"
            } max-h-28 shrink-0 flex-row overflow-x-auto border-b border-white/10 bg-ink-800 lg:h-full lg:max-h-none lg:w-52 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r`}
          >
            <div className="hidden px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-zinc-400 lg:block">
              Files
            </div>
            {!hasFiles && (
              <p className="hidden px-4 text-xs leading-5 text-zinc-400 lg:block">
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
                className={`flex shrink-0 items-center gap-2 px-4 py-3 text-left text-sm lg:w-full ${
                  currentFile === file ? "bg-ink-700 text-gold" : "text-zinc-200 hover:bg-ink-700"
                }`}
              >
                <i className="ri-file-code-line text-zinc-400" aria-hidden />
                <span className="truncate">{file}</span>
              </button>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className={`${mobilePane === "preview" ? "hidden lg:flex" : "flex"} items-center justify-between border-b border-white/10`}>
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
                  className="min-h-10 rounded-lg bg-tide px-4 py-1.5 text-sm font-semibold text-ink-950 hover:bg-teal-200 disabled:opacity-60"
                >
                  {running ? "Running…" : "Run"}
                </button>
              </div>
            </div>

            {runHint && (
              <p className="border-b border-white/10 px-4 py-2 text-xs text-gold">{runHint}</p>
            )}

            <div className="flex min-h-0 flex-1">
              <div
                className={`${
                  mobilePane === "preview" ? "hidden lg:flex" : "flex"
                } min-w-0 flex-1 flex-col`}
              >
                {!hasFiles ? (
                  <div className="flex flex-1 flex-col justify-center gap-4 overflow-auto px-4 py-6 sm:px-8">
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
                  <CodeEditor
                    filename={currentFile}
                    value={fileTree[currentFile].file.contents}
                    onChange={updateFileContents}
                  />
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

              {(mobilePane === "preview" || (showPreview && iframeUrl && webContainer)) && (
                <div
                  className={`${
                    mobilePane === "preview" ? "flex" : "hidden"
                  } w-full min-w-0 flex-col border-l border-white/10 lg:flex lg:w-[26rem] lg:shrink-0 ${
                    showPreview && iframeUrl && webContainer ? "" : "lg:hidden"
                  }`}
                >
                  {iframeUrl ? (
                    <>
                      <label htmlFor="preview-url" className="sr-only">
                        Preview URL
                      </label>
                      <input
                        id="preview-url"
                        type="text"
                        onChange={(e) => setIframeUrl(e.target.value)}
                        value={iframeUrl}
                        className="border-b border-white/10 bg-ink-800 px-3 py-2 text-sm"
                      />
                      <iframe title="Nexora preview" src={iframeUrl} className="h-full w-full bg-white" />
                    </>
                  ) : (
                    <div className="grid flex-1 place-items-center px-6 text-center text-sm text-zinc-400">
                      <p>
                        No preview yet. Generate files with @ai, then tap Run in Chrome on a desktop.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <nav
        className="flex shrink-0 border-t border-white/10 bg-ink-900 lg:hidden"
        aria-label="Room views"
      >
        {[
          { id: "chat", icon: "ri-chat-3-line", label: "Chat" },
          { id: "workspace", icon: "ri-code-s-slash-line", label: "Code" },
          { id: "preview", icon: "ri-window-line", label: "Preview" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobilePane(tab.id)}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${
              mobilePane === tab.id ? "text-gold" : "text-zinc-400"
            }`}
            aria-current={mobilePane === tab.id ? "page" : undefined}
          >
            <i className={`${tab.icon} text-lg`} aria-hidden />
            {tab.label}
          </button>
        ))}
      </nav>

      {isSidePanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={() => setIsSidePanelOpen(false)}
          role="presentation"
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="people-title"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,90vw)] flex-col bg-ink-800 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 id="people-title" className="text-sm font-semibold">
                Collaborators
              </h2>
              <button
                onClick={() => setIsSidePanelOpen(false)}
                className="grid h-11 w-11 place-items-center text-zinc-300"
                aria-label="Close people list"
              >
                <i className="ri-close-fill text-lg" aria-hidden />
              </button>
            </header>
            <div className="flex flex-col gap-1 overflow-auto p-2">
              {(project.users || []).map((collaborator) => (
                <div
                  key={collaborator._id || collaborator.email}
                  className="flex items-center gap-2 rounded-xl p-2"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-ink-700 text-gold">
                    <i className="ri-user-fill" aria-hidden />
                  </div>
                  <p className="min-w-0 truncate text-sm">{collaborator.email}</p>
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
          </aside>
        </div>
      )}

      {isModalOpen && (
        <Modal
          title="Invite to this room"
          description="Newest accounts show first. Search if the list is long."
          onClose={() => setIsModalOpen(false)}
          footer={
            <button
              onClick={addCollaborators}
              className="mt-4 min-h-11 w-full rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-ink-950"
            >
              Add collaborators
            </button>
          }
        >
          <label htmlFor="invite-search" className="sr-only">
            Search people by email
          </label>
          <input
            id="invite-search"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Search email"
            className="mb-3 w-full rounded-xl border border-white/10 bg-ink-950 px-3 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-gold/40 sm:text-sm"
          />
          <div className="flex max-h-[50vh] flex-col gap-2 overflow-auto">
            {loadingUsers && (
              <p className="px-2 text-sm text-zinc-400">Refreshing users…</p>
            )}
            {inviteCandidates.map((listedUser) => {
              const alreadyIn = (project.users || []).some(
                (member) =>
                  String(member._id) === String(listedUser._id) ||
                  member.email === listedUser.email
              );
              const selected = [...selectedUserId].some(
                (id) => String(id) === String(listedUser._id)
              );
              return (
                <button
                  type="button"
                  key={listedUser._id}
                  disabled={alreadyIn}
                  className={`flex min-h-12 items-center gap-2 rounded-xl p-2 text-left hover:bg-ink-700 ${
                    selected ? "bg-ink-700" : ""
                  } ${alreadyIn ? "opacity-50" : ""}`}
                  onClick={() => {
                    if (!alreadyIn) handleUserClick(listedUser._id);
                  }}
                >
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-ink-700 text-gold">
                    <i className="ri-user-fill" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{listedUser.email}</p>
                    {alreadyIn && (
                      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                        Already in this room
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
            {!loadingUsers && users.length === 0 && (
              <p className="px-2 text-sm text-zinc-400">No other users yet.</p>
            )}
            {!loadingUsers && users.length > 0 && inviteCandidates.length === 0 && (
              <p className="px-2 text-sm text-zinc-400">No matching accounts.</p>
            )}
          </div>
        </Modal>
      )}
    </main>
  );
};

export default Project;

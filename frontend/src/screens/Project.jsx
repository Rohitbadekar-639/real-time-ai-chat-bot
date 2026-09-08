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

function SyntaxHighlightedCode(props) {
  const ref = useRef(null);

  React.useEffect(() => {
    if (ref.current && props.className?.includes("lang-") && window.hljs) {
      window.hljs.highlightElement(ref.current);

      // hljs won't reprocess the element unless this attribute is removed
      ref.current.removeAttribute("data-highlighted");
    }
  }, [props.className, props.children]);

  return <code {...props} ref={ref} />;
}

const Project = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(new Set()); // Initialized as Set
  const [project, setProject] = useState(location.state?.project);
  const [message, setMessage] = useState("");
  const { user } = useContext(UserContext);
  const messageBox = useRef(null);

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]); // New state variable for messages
  const [fileTree, setFileTree] = useState({});

  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);

  const [webContainer, setWebContainer] = useState(null);
  const webContainerRef = useRef(null);
  const [iframeUrl, setIframeUrl] = useState(null);

  const [runProcess, setRunProcess] = useState(null);
  const [runHint, setRunHint] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

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
      .then((res) => {
        console.log(res.data);
        setIsModalOpen(false);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const send = () => {
    if (!message.trim()) {
      return;
    }
    sendMessage("project-message", {
      message,
      sender: user,
    });
    if (message.includes("@ai")) {
      setAiBusy(true);
    }
    setMessages((prevMessages) => [...prevMessages, { sender: user, message }]);
    setMessage("");
  };

  function WriteAiMessage(message) {
    let messageObject = { text: message };
    try {
      messageObject = JSON.parse(message);
    } catch {
      messageObject = { text: message };
    }

    return (
      <div className="overflow-auto bg-ink-950 text-tide rounded-sm p-2">
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
          console.log("container started");
        })
        .catch((err) => {
          console.log(err);
          setRunHint("In-browser run needs a Chromium browser. Chat and AI still work.");
        });
    }

    receiveMessage("message-history", (history) => {
      if (Array.isArray(history)) {
        setMessages(history);
      }
    });

    receiveMessage("project-message", (data) => {
      console.log(data);

      if (data.sender._id == "ai") {
        setAiBusy(false);
        try {
          const parsed = JSON.parse(data.message);

          if (parsed.fileTree) {
            webContainerRef.current?.mount(parsed.fileTree);
            setFileTree(parsed.fileTree || {});
            const firstFile = Object.keys(parsed.fileTree)[0];
            if (firstFile) {
              setCurrentFile(firstFile);
              setOpenFiles((prev) => [...new Set([...prev, firstFile])]);
            }
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
        console.log(res.data.project);

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
  }, [messages]);

  function saveFileTree(ft) {
    axios
      .put("/projects/update-file-tree", {
        projectId: project._id,
        fileTree: ft,
      })
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  if (!project) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-950 text-zinc-400">
        Returning to rooms…
      </div>
    );
  }

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-ink-950 text-zinc-100">
      <section className="left relative flex h-screen min-w-80 flex-col border-r border-white/10 bg-ink-800">
        <header className="absolute top-0 z-10 flex w-full items-center justify-between border-b border-white/10 bg-ink-700 px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              className="text-xs text-zinc-400 hover:text-gold"
              onClick={() => navigate("/app")}
            >
              ← Rooms
            </button>
            <button className="flex gap-2 text-sm" onClick={() => setIsModalOpen(true)}>
              <i className="ri-add-fill mr-1 text-gold"></i>
              <p>Add collaborator</p>
            </button>
          </div>
          <button
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="p-2"
          >
            <i className="ri-group-fill"></i>
          </button>
        </header>
        <div className="conversation-area relative flex h-full flex-grow flex-col pb-14 pt-14">
          <div
            ref={messageBox}
            className="message-box scrollbar-hide flex max-h-full flex-grow flex-col gap-2 overflow-auto p-3"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${
                  msg.sender._id === "ai" ? "max-w-80" : "max-w-52"
                } ${
                  msg.sender._id == user?._id?.toString() && "ml-auto"
                }  message flex w-fit flex-col rounded-xl p-2 ${
                  msg.sender._id === "ai"
                    ? "border border-tide/20 bg-ink-950"
                    : "bg-ink-700"
                }`}
              >
                <small className="text-xs text-zinc-500">{msg.sender.email}</small>
                <div className="text-sm">
                  {msg.sender._id === "ai" ? (
                    WriteAiMessage(msg.message)
                  ) : (
                    <p>{msg.message}</p>
                  )}
                </div>
              </div>
            ))}
            {aiBusy && (
              <div className="w-fit max-w-80 rounded-xl border border-tide/20 bg-ink-950 p-2">
                <small className="text-xs text-zinc-500">AI</small>
                <p className="text-sm text-tide">Generating a workspace…</p>
              </div>
            )}
          </div>

          <div className="inputField absolute bottom-0 flex w-full border-t border-white/10">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  send();
                }
              }}
              className="flex-grow bg-ink-900 px-4 py-3 text-sm outline-none placeholder:text-zinc-500"
              type="text"
              placeholder="Message the room · type @ai to generate code"
            />
            <button onClick={send} className="bg-gold px-5 text-ink-950">
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>
        <div
          className={`sidePanel absolute top-0 flex h-full w-full flex-col gap-2 bg-ink-800 transition-all ${
            isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <header className="flex items-center justify-between bg-ink-700 p-2 px-4">
            <h1 className="text-lg font-semibold">Collaborators</h1>

            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className="p-2"
            >
              <i className="ri-close-fill"></i>
            </button>
          </header>
          <div className="users flex flex-col gap-2">
            {project.users &&
              project.users.map((collaborator) => {
                return (
                  <div
                    key={collaborator._id || collaborator.email}
                    className="user flex cursor-pointer items-center gap-2 p-2 hover:bg-ink-700"
                  >
                    <div className="relative flex aspect-square h-fit w-fit items-center justify-center rounded-full bg-ink-700 p-5 text-gold">
                      <i className="ri-user-fill absolute"></i>
                    </div>
                    <h1 className="text-sm font-semibold">{collaborator.email}</h1>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      <section className="right flex h-full flex-grow bg-ink-900">
        <div className="explorer h-full min-w-52 max-w-64 border-r border-white/10 bg-ink-800">
          <div className="px-4 py-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
            Files
          </div>
          <div className="file-tree w-full">
            {Object.keys(fileTree).length === 0 && (
              <p className="px-4 text-xs leading-5 text-zinc-500">
                Ask @ai to generate a project. The file tree will appear here.
              </p>
            )}
            {Object.keys(fileTree).map((file, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentFile(file);
                  setOpenFiles([...new Set([...openFiles, file])]);
                }}
                className="tree-element flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left hover:bg-ink-700"
              >
                <p className="text-sm font-semibold">{file}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="code-editor flex h-full min-w-0 flex-grow flex-col">
          <div className="top flex w-full items-center justify-between border-b border-white/10">
            <div className="files flex overflow-auto">
              {openFiles.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFile(file)}
                  className={`open-file flex w-fit cursor-pointer items-center gap-2 px-4 py-2 ${
                    currentFile === file ? "bg-ink-700 text-gold" : "text-zinc-400"
                  }`}
                >
                  <p className="text-sm font-semibold">{file}</p>
                </button>
              ))}
            </div>

            <div className="actions flex gap-2">
              <button
                onClick={async () => {
                  if (!webContainer) {
                    setRunHint("WebContainer is not ready in this browser yet.");
                    return;
                  }
                  try {
                    await webContainer.mount(fileTree);

                    const installProcess = await webContainer.spawn("npm", [
                      "install",
                    ]);

                    installProcess.output.pipeTo(
                      new WritableStream({
                        write(chunk) {
                          console.log(chunk);
                        },
                      })
                    );

                    if (runProcess) {
                      runProcess.kill();
                    }

                    let tempRunProcess = await webContainer.spawn("npm", [
                      "start",
                    ]);

                    tempRunProcess.output.pipeTo(
                      new WritableStream({
                        write(chunk) {
                          console.log(chunk);
                        },
                      })
                    );

                    setRunProcess(tempRunProcess);

                    webContainer.on("server-ready", (port, url) => {
                      console.log(port, url);
                      setIframeUrl(url);
                    });
                  } catch (err) {
                    console.log(err);
                    setRunHint("Run failed. Chat and file editing still work.");
                  }
                }}
                className="bg-tide px-4 py-2 text-sm font-semibold text-ink-950"
              >
                Run
              </button>
            </div>
          </div>
          {runHint && (
            <p className="border-b border-white/10 px-4 py-2 text-xs text-gold">{runHint}</p>
          )}
          <div className="bottom flex max-w-full flex-grow overflow-auto">
            {fileTree[currentFile] && (
              <div className="code-editor-area h-full flex-grow overflow-auto bg-ink-950">
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
                      __html: hljs.highlight(
                        "javascript",
                        fileTree[currentFile].file.contents
                      ).value,
                    }}
                    style={{
                      whiteSpace: "pre-wrap",
                      paddingBottom: "25rem",
                      counterSet: "line-numbering",
                    }}
                  />
                </pre>
              </div>
            )}
          </div>
        </div>

        {iframeUrl && webContainer && (
          <div className="flex h-full min-w-96 flex-col border-l border-white/10">
            <div className="address-bar">
              <input
                type="text"
                onChange={(e) => setIframeUrl(e.target.value)}
                value={iframeUrl}
                className="w-full bg-ink-800 px-4 py-2 text-sm"
              />
            </div>
            <iframe src={iframeUrl} className="h-full w-full bg-white"></iframe>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="relative w-96 max-w-full rounded-2xl border border-white/10 bg-ink-800 p-4">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Select User</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2">
                <i className="ri-close-fill"></i>
              </button>
            </header>
            <div className="users-list mb-16 flex max-h-96 flex-col gap-2 overflow-auto">
              {users.map((listedUser) => (
                <div
                  key={listedUser._id}
                  className={`user flex cursor-pointer items-center gap-2 p-2 hover:bg-ink-700 ${
                    Array.from(selectedUserId).indexOf(listedUser._id) != -1
                      ? "bg-ink-700"
                      : ""
                  }`}
                  onClick={() => handleUserClick(listedUser._id)}
                >
                  <div className="relative flex aspect-square h-fit w-fit items-center justify-center rounded-full bg-ink-700 p-5 text-gold">
                    <i className="ri-user-fill absolute"></i>
                  </div>
                  <h1 className="text-sm font-semibold">{listedUser.email}</h1>
                </div>
              ))}
            </div>
            <button
              onClick={addCollaborators}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 transform rounded-xl bg-gold px-4 py-2 font-semibold text-ink-950"
            >
              Add Collaborators
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;

"use client";
import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  Plus,
  MessageSquare,
  Library,
  Bot,
  SlidersHorizontal,
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  File,
  BookOpen,
  Sparkles,
  Battery,
  Globe,
  PanelLeftClose,
  PanelLeft,
  Check,
  CheckCheck,
  X,
  Upload,
  Link2,
  MoreHorizontal,
  ExternalLink,
  Clock,
  ShieldCheck,
  Command,
  Loader2,
  Trash2,
  Download,
  Copy,
  Settings2,
  Database,
  HardDrive,
  Network,
  Info,
  CheckCircle2,
  AlertCircle,
  SquarePen,
  Layers,
  Menu,
  Lightbulb,
  RotateCw,
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type {
  Agent,
  KnowledgeDocument,
  Conversation,
  Message,
  Citation,
  Settings,
  Workspace,
} from "@/lib/knowledge/types";
import { defaultAgents, defaultSettings } from "@/lib/knowledge/seeds";
type View = "chat" | "library" | "agents" | "connections";
type Connections = {
  openai: boolean;
  openrouter: boolean;
  local: boolean;
  embeddings: boolean;
  qdrant: boolean;
  database: string;
  storage: string;
  onnx: boolean;
  embeddingModel: string | null;
};
const suggestions = [
  {
    icon: Battery,
    title: "Understand the fundamentals",
    text: "What is the difference between capacity and energy?",
    label: "Battery science",
    color: "amber",
  },
  {
    icon: Layers,
    title: "Explore a technical concept",
    text: "How does salt concentration affect ionic conductivity?",
    label: "Electrolyte properties",
    color: "blue",
  },
  {
    icon: BookOpen,
    title: "Find your next step",
    text: "How do I add knowledge to this workspace?",
    label: "Getting started",
    color: "green",
  },
];
function AgentIcon({ agent, size = 18 }: { agent?: Agent; size?: number }) {
  const Icon =
    agent?.icon === "battery"
      ? Battery
      : agent?.icon === "book"
        ? BookOpen
        : Sparkles;
  return <Icon size={size} />;
}
async function api<T = any>(url: string, options?: RequestInit): Promise<T> {
  const r = await fetch(url, options);
  const d: any = await r.json();
  if (!r.ok)
    throw new Error(d.error || "Something went wrong. Please try again.");
  return d;
}
function json(method: string, body: unknown) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
function prettySize(n: number) {
  return n < 1024
    ? `${n} B`
    : n < 1048576
      ? `${(n / 1024).toFixed(1)} KB`
      : `${(n / 1048576).toFixed(1)} MB`;
}
function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const controls = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,textarea,select,[tabindex="0"]',
        ) ?? [],
      );
    controls()[0]?.focus();
    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const items = controls();
      const first = items[0],
        last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    dialog?.addEventListener("keydown", trap);
    return () => {
      dialog?.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "wide" : ""}`}
      >
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export default function Home() {
  const [view, setView] = useState<View>("chat");
  const [workspace, setWorkspace] = useState<Workspace>({
    agents: defaultAgents,
    documents: [],
    conversations: [],
    settings: defaultSettings,
  });
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [connections, setConnections] = useState<Connections | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [agentId, setAgentId] = useState("general");
  const [agentMenu, setAgentMenu] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [sidebar, setSidebar] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All documents");
  const [source, setSource] = useState<KnowledgeDocument | Citation | null>(
    null,
  );
  const [upload, setUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "text">("file");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadText, setUploadText] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploadTopic, setUploadTopic] = useState("General");
  const [draft, setDraft] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [editing, setEditing] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<KnowledgeDocument | null>(
    null,
  );
  const [docMenu, setDocMenu] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [citationMessage, setCitationMessage] = useState<Message | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const activeAgent =
    workspace.agents.find((a) => a.id === agentId) ?? defaultAgents[0];
  const enabled = workspace.agents.filter((a) => a.enabled);
  const readyDocs = workspace.documents.filter((d) => d.status === "ready");
  async function refresh() {
    const [w, c] = await Promise.all([
      api<Workspace>("/api/workspace"),
      api<Connections>("/api/connections"),
    ]);
    setWorkspace(w);
    setConnections(c);
    setSettings(w.settings);
    setLoaded(true);
    return w;
  }
  useEffect(() => {
    refresh().catch((e) => {
      setLoadError(e.message);
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setUpload(false);
        setEditing(null);
        setSource(null);
        setCitationMessage(null);
        setShowSetup(false);
        setConfirmDelete(null);
        setAgentMenu(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setView("library");
        setTimeout(
          () => document.getElementById("library-search")?.focus(),
          50,
        );
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  function notify(s: string) {
    setToast(s);
  }
  function navigate(v: View) {
    setView(v);
    setSidebar(false);
    setDocMenu(null);
  }
  function newChat(id = agentId) {
    if (busy) return;
    setAgentId(id);
    setConversationId(null);
    setMessages([]);
    setQuestion("");
    navigate("chat");
    setAgentMenu(false);
    setTimeout(() => inputRef.current?.focus(), 30);
  }
  function openConversation(c: Conversation) {
    if (busy) return;
    setConversationId(c.id);
    setMessages(c.messages);
    setAgentId(c.agentId);
    navigate("chat");
  }
  async function send(text = question) {
    if (!text.trim() || busy || !loaded || loadError) return;
    if (text.trim() === "/ingest" || text.trim() === "/knowledge add") {
      setQuestion("");
      setUpload(true);
      return;
    }
    const value = text.trim();
    setQuestion("");
    setMessages((p) => [
      ...p,
      { id: crypto.randomUUID(), role: "user", content: value },
    ]);
    setBusy(true);
    setAgentMenu(false);
    try {
      const result = await api(
        "/api/chat",
        json("POST", {
          question: value,
          agentId,
          conversationId: conversationId ?? undefined,
        }),
      );
      setMessages(result.conversation.messages);
      setConversationId(result.conversation.id);
      setWorkspace((p) => ({
        ...p,
        conversations: [
          result.conversation,
          ...p.conversations.filter((c) => c.id !== result.conversation.id),
        ],
      }));
    } catch (e) {
      setMessages((p) => p.slice(0, -1));
      setQuestion(value);
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function addDocument() {
    if (uploading) return;
    setUploading(true);
    setUploadError("");
    try {
      const f = new FormData();
      if (uploadMode === "file") {
        if (!uploadFile) throw new Error("Choose a file to upload.");
        f.append("file", uploadFile);
      } else {
        f.append("text", uploadText);
        f.append("name", uploadName || "Untitled note.md");
      }
      f.append("topic", uploadTopic);
      f.append("status", draft ? "draft" : "ready");
      const result = await api("/api/documents", { method: "POST", body: f });
      await refresh();
      setUpload(false);
      setUploadFile(null);
      setUploadText("");
      setUploadName("");
      notify(
        result.warning || `${result.document.name} added to your knowledge.`,
      );
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  async function saveAgent() {
    if (!editing) return;
    setSaving(true);
    try {
      await api("/api/agents", json("PUT", editing));
      await refresh();
      setEditing(null);
      notify("Assistant settings saved.");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function changeDocument(doc: KnowledgeDocument, reindex = false) {
    setDocMenu(null);
    try {
      await api(
        "/api/documents",
        json("PATCH", {
          id: doc.id,
          status: doc.status === "ready" ? "draft" : "ready",
          reindex,
        }),
      );
      await refresh();
      notify(
        reindex
          ? "Document indexed in Qdrant."
          : doc.status === "ready"
            ? "Document moved to drafts."
            : "Document published.",
      );
    } catch (e) {
      notify((e as Error).message);
    }
  }
  async function deleteDocument() {
    if (!confirmDelete) return;
    try {
      await api(`/api/documents?id=${encodeURIComponent(confirmDelete.id)}`, {
        method: "DELETE",
      });
      await refresh();
      setConfirmDelete(null);
      notify("Document deleted.");
    } catch (e) {
      notify((e as Error).message);
    }
  }
  async function saveConnections() {
    setSavingSettings(true);
    try {
      await api("/api/connections", json("PUT", settings));
      await refresh();
      notify("Connection preferences saved.");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setSavingSettings(false);
    }
  }
  async function deleteConversation(c: Conversation) {
    try {
      await api(`/api/chat?id=${c.id}`, { method: "DELETE" });
      if (conversationId === c.id) newChat();
      setWorkspace((w) => ({
        ...w,
        conversations: w.conversations.filter((x) => x.id !== c.id),
      }));
    } catch (e) {
      notify((e as Error).message);
    }
  }
  const visibleDocs = workspace.documents.filter(
    (d) =>
      (filter === "All documents" ||
        (filter === "Published" && d.status === "ready") ||
        (filter === "Drafts" && d.status === "draft") ||
        (filter === "Examples" && d.sample)) &&
      `${d.name} ${d.topic}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebar ? "open" : ""}`}>
        <a className="brand" href="/" aria-label="3L Knowledge home">
          <span className="brand-symbol">
            <Layers size={23} strokeWidth={1.8} />
          </span>
          <span>
            3L <strong>Knowledge</strong>
            <small>YOUR TEAM’S KNOWLEDGE, CONNECTED</small>
          </span>
        </a>
        <div className="workspace-switch">
          <div className="workspace-avatar">3L</div>
          <div>
            <strong>My workspace</strong>
            <small>Private workspace</small>
          </div>
          <ShieldCheck size={15} />
        </div>
        <button className="new-chat" onClick={() => newChat()} disabled={busy}>
          <Plus size={17} /> New conversation <span>↗</span>
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {(
            [
              { id: "chat", label: "Chat", icon: MessageSquare },
              { id: "library", label: "Knowledge library", icon: Library },
              { id: "agents", label: "Agents", icon: Bot },
              {
                id: "connections",
                label: "Connections",
                icon: SlidersHorizontal,
              },
            ] as const
          ).map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className={`nav-item ${view === n.id ? "active" : ""}`}
            >
              <n.icon size={18} />
              {n.label}
              {n.id === "library" && (
                <span className="count">{workspace.documents.length}</span>
              )}
              {view === n.id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="history-heading">
          <span className="nav-label">RECENT CONVERSATIONS</span>
          <Clock size={13} />
        </div>
        <div className="history">
          {workspace.conversations.length ? (
            workspace.conversations.slice(0, 8).map((c) => (
              <div
                key={c.id}
                className={`history-row ${conversationId === c.id && view === "chat" ? "selected" : ""}`}
              >
                <button onClick={() => openConversation(c)} disabled={busy}>
                  <MessageSquare size={14} />
                  <span>{c.title}</span>
                </button>
                <button
                  className="history-delete"
                  aria-label={`Delete conversation ${c.title}`}
                  onClick={() => deleteConversation(c)}
                >
                  <X size={12} />
                </button>
              </div>
            ))
          ) : (
            <p className="no-history">Your conversations will appear here.</p>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="privacy-card">
            <ShieldCheck size={18} />
            <div>
              <strong>A space for trusted answers</strong>
              <p>
                Grounded in the knowledge
                <br />
                you choose to share.
              </p>
            </div>
          </div>
          <button className="user-card" onClick={() => setShowSetup(true)}>
            <span className="user-avatar">LL</span>
            <span>
              <strong>Workspace owner</strong>
              <small>Personal workspace</small>
            </span>
            <Settings2 size={16} />
          </button>
        </div>
      </aside>
      {sidebar && (
        <div className="sidebar-scrim" onClick={() => setSidebar(false)} />
      )}
      <main className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setSidebar(true)}
            >
              <Menu size={20} />
            </button>
            <span className="crumb-home">Workspace</span>
            <ChevronRight size={13} />
            <strong>
              {view === "chat"
                ? "Chat"
                : view === "library"
                  ? "Knowledge library"
                  : view === "agents"
                    ? "Agents"
                    : "Connections"}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="private-label">
              <ShieldCheck size={13} /> Private
            </span>
            <button
              className="mode-badge"
              onClick={() => navigate("connections")}
            >
              <span
                className={
                  workspace.settings.provider === "demo"
                    ? "status-dot amber"
                    : "status-dot"
                }
              />
              {workspace.settings.provider === "demo"
                ? "Demo workspace"
                : "Connected workspace"}
            </button>
            <button
              className="help-button"
              onClick={() => setShowSetup(true)}
              aria-label="Workspace information"
            >
              ?
            </button>
          </div>
        </header>
        {loadError && (
          <div className="error-banner">
            <AlertCircle size={17} />
            {loadError}
            <button
              onClick={() => {
                setLoadError("");
                refresh().catch((e) => setLoadError(e.message));
              }}
            >
              Retry
            </button>
          </div>
        )}
        {view === "chat" && (
          <div
            className={`chat-layout ${messages.length ? "has-messages" : ""}`}
          >
            <div className="chat-main">
              <div className="chat-toolbar">
                <div className="agent-select-wrap">
                  <button
                    className="agent-selector"
                    disabled={busy}
                    onClick={() => setAgentMenu(!agentMenu)}
                  >
                    <span className={`agent-mini ${activeAgent.color}`}>
                      <AgentIcon agent={activeAgent} size={16} />
                    </span>
                    {activeAgent.name}
                    <ChevronDown size={14} />
                  </button>
                  {agentMenu && (
                    <div className="agent-menu">
                      {enabled.map((a) => (
                        <button key={a.id} onClick={() => newChat(a.id)}>
                          <span className={`agent-mini ${a.color}`}>
                            <AgentIcon agent={a} />
                          </span>
                          <span>
                            <strong>{a.name}</strong>
                            <small>{a.description}</small>
                          </span>
                          {agentId === a.id && <Check size={16} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="toolbar-scope">
                  <span className="status-dot" />
                  {activeAgent.topic === "all"
                    ? "All published knowledge"
                    : activeAgent.topic}
                </span>
              </div>
              {!messages.length ? (
                <div className="welcome">
                  <div className="welcome-emblem">
                    <div className="emblem-ring" />
                    <div className="emblem-core">
                      <Sparkles size={32} strokeWidth={1.4} />
                    </div>
                    <span className="emblem-dot one" />
                    <span className="emblem-dot two" />
                    <span className="emblem-dot three" />
                  </div>
                  <div className="eyebrow">
                    A LITTLE CLARITY GOES A LONG WAY
                  </div>
                  <h1>
                    Your knowledge.
                    <br />
                    <span>A conversation away.</span>
                  </h1>
                  <p className="welcome-copy">
                    Turn your documents into answers you can trust.
                    <br />
                    Ask a question. Find the source. Keep moving.
                  </p>
                  <div className="suggestion-grid">
                    {suggestions.map((s, i) => (
                      <button
                        className="suggestion-card"
                        key={s.title}
                        disabled={busy || !loaded}
                        onClick={() => {
                          const id = i === 2 ? "guides" : "battery";
                          setAgentId(id);
                          setQuestion(s.text);
                          inputRef.current?.focus();
                        }}
                      >
                        <span className={`suggestion-icon ${s.color}`}>
                          <s.icon size={18} />
                        </span>
                        <strong>{s.title}</strong>
                        <p>{s.text}</p>
                        <span className="suggestion-bottom">
                          {s.label}
                          <ArrowUpRight size={14} />
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="welcome-foot">
                    <ShieldCheck size={14} /> Answers grounded in your sources.
                    Always within scope.
                  </div>
                </div>
              ) : (
                <div className="messages">
                  {messages.map((m) => (
                    <div key={m.id} className={`message ${m.role}`}>
                      {m.role === "assistant" && (
                        <span className="answer-avatar">
                          <AgentIcon agent={activeAgent} size={19} />
                        </span>
                      )}
                      <div className="message-body">
                        {m.role === "assistant" && (
                          <div className="answer-heading">
                            {activeAgent.name}
                            <span>{m.mode}</span>
                          </div>
                        )}
                        <div className="message-text">
                          <Markdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            skipHtml
                          >
                            {m.content}
                          </Markdown>
                        </div>
                        {m.role === "assistant" && (
                          <div className="answer-tools">
                            {!!m.citations?.length && (
                              <button
                                className="source-pill"
                                onClick={() => setCitationMessage(m)}
                              >
                                <BookOpen size={13} />
                                {m.citations.length} sources
                                <ChevronRight size={13} />
                              </button>
                            )}
                            <button
                              className="icon-button"
                              aria-label="Copy answer"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    m.content,
                                  );
                                  notify("Answer copied.");
                                } catch {
                                  notify(
                                    "Your browser could not copy the answer.",
                                  );
                                }
                              }}
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {busy && (
                    <div className="message assistant">
                      <span className="answer-avatar">
                        <AgentIcon agent={activeAgent} />
                      </span>
                      <div className="thinking">
                        <span />
                        <span />
                        <span />
                        Searching your knowledge…
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              )}
              <div className="composer-area">
                <div className={`composer ${busy ? "is-busy" : ""}`}>
                  <textarea
                    ref={inputRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        !e.nativeEvent.isComposing
                      ) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={`Ask ${activeAgent.id === "general" ? "anything about your knowledge" : activeAgent.name.toLowerCase()}…`}
                    rows={2}
                    maxLength={5000}
                    aria-label="Your question"
                    disabled={busy}
                  />
                  <div className="composer-bottom">
                    <div className="composer-left">
                      <button
                        className="attach-button"
                        onClick={() => setUpload(true)}
                        aria-label="Add knowledge"
                      >
                        <Plus size={20} />
                      </button>
                      <span className="composer-divider" />
                      <span>
                        <BookOpen size={13} />
                        {readyDocs.length} published sources
                      </span>
                    </div>
                    <div className="composer-right">
                      <span>↵ to send</span>
                      <button
                        className="send-button"
                        aria-label="Send question"
                        disabled={
                          busy || !question.trim() || !loaded || !!loadError
                        }
                        onClick={() => send()}
                      >
                        {busy ? (
                          <Loader2 size={18} className="spin" />
                        ) : (
                          <ArrowUp size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="composer-note">
                  {workspace.settings.provider === "demo" ? (
                    <>
                      You’re in demo mode. Answers show source excerpts.{" "}
                      <button onClick={() => navigate("connections")}>
                        Connect a model <ArrowUpRight size={10} />
                      </button>
                    </>
                  ) : (
                    <>
                      AI can make mistakes. Check important information against
                      its sources.
                    </>
                  )}
                </p>
              </div>
            </div>
            <aside className="context-panel">
              <div className="context-heading">
                <span>YOUR KNOWLEDGE</span>
                <Library size={15} />
              </div>
              <h3>
                Good answers start
                <br />
                with good sources.
              </h3>
              <p className="context-intro">
                A focused collection.
                <br />A clearer conversation.
              </p>
              <div className="collection-card">
                <div className="collection-icon">
                  <Layers size={23} strokeWidth={1.4} />
                </div>
                <strong>Workspace collection</strong>
                <p>{readyDocs.length} published documents</p>
                <div className="collection-meter">
                  <span
                    style={{
                      width: `${Math.min(100, (readyDocs.length / 10) * 100)}%`,
                    }}
                  />
                </div>
                <div className="collection-caption">
                  <span>
                    {workspace.documents.reduce(
                      (n, d) => n + d.chunks.length,
                      0,
                    )}{" "}
                    searchable passages
                  </span>
                  <span className="status-dot" />
                </div>
              </div>
              <div className="context-subheading">
                IN YOUR LIBRARY
                <button onClick={() => navigate("library")}>
                  View all <ArrowUpRight size={12} />
                </button>
              </div>
              <div className="context-documents">
                {readyDocs.slice(0, 4).map((d) => (
                  <button key={d.id} onClick={() => setSource(d)}>
                    <span
                      className={`document-icon ${d.type === "pdf" ? "rose" : "blue"}`}
                    >
                      <FileText size={18} />
                    </span>
                    <span>
                      <strong>{d.name}</strong>
                      <small>
                        {d.topic}
                        {d.sample ? " · Example" : ""}
                      </small>
                    </span>
                    <ChevronRight size={13} />
                  </button>
                ))}
              </div>
              <button className="add-source" onClick={() => setUpload(true)}>
                <Plus size={15} /> Add knowledge
              </button>
              <div className="context-tip">
                <Lightbulb size={17} />
                <p>
                  <strong>Make it your own</strong>Upload a guide or paste a
                  note. Your next answer can start there.
                </p>
              </div>
              <div className="context-bottom">
                <span className="tiny-brand">3L</span>Less searching. More
                understanding.
              </div>
            </aside>
          </div>
        )}
        {view === "library" && (
          <div className="content-page">
            <div className="page-heading">
              <div>
                <div className="eyebrow">A HOME FOR WHAT YOU KNOW</div>
                <h1>Knowledge library</h1>
                <p>The sources behind every good answer.</p>
              </div>
              <button
                className="primary-button"
                onClick={() => setUpload(true)}
              >
                <Plus size={17} /> Add knowledge
              </button>
            </div>
            <div className="stats-row">
              <div>
                <span className="stat-icon green">
                  <Library size={19} />
                </span>
                <span>
                  <strong>{workspace.documents.length}</strong>
                  <small>Documents</small>
                </span>
              </div>
              <div>
                <span className="stat-icon blue">
                  <CheckCheck size={19} />
                </span>
                <span>
                  <strong>{readyDocs.length}</strong>
                  <small>Published</small>
                </span>
              </div>
              <div>
                <span className="stat-icon amber">
                  <Layers size={19} />
                </span>
                <span>
                  <strong>
                    {workspace.documents.reduce(
                      (n, d) => n + d.chunks.length,
                      0,
                    )}
                  </strong>
                  <small>Searchable passages</small>
                </span>
              </div>
              <div>
                <span className="stat-icon purple">
                  <HardDrive size={19} />
                </span>
                <span>
                  <strong>
                    {prettySize(
                      workspace.documents.reduce((n, d) => n + d.size, 0),
                    )}
                  </strong>
                  <small>Total size</small>
                </span>
              </div>
            </div>
            <div className="library-toolbar">
              <div className="tabs">
                {["All documents", "Published", "Drafts", "Examples"].map(
                  (f) => (
                    <button
                      key={f}
                      className={filter === f ? "selected" : ""}
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </button>
                  ),
                )}
              </div>
              <label className="search-input">
                <Search size={16} />
                <input
                  id="library-search"
                  placeholder="Search documents…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <kbd>⌘ K</kbd>
              </label>
            </div>
            <div className="document-table">
              <div className="table-heading">
                <span>DOCUMENT</span>
                <span>TOPIC</span>
                <span>STATUS</span>
                <span>ADDED</span>
                <span />
              </div>
              {!visibleDocs.length ? (
                <div className="empty-state">
                  <Search size={26} />
                  <h3>
                    {search ? "No matching documents" : "No documents here yet"}
                  </h3>
                  <p>
                    {search
                      ? "Try another name or topic."
                      : "Add a document to start building your knowledge."}
                  </p>
                  <button
                    className="secondary-button"
                    onClick={() => setUpload(true)}
                  >
                    Add knowledge
                  </button>
                </div>
              ) : (
                visibleDocs.map((d) => (
                  <div className="document-row" key={d.id}>
                    <button className="doc-name" onClick={() => setSource(d)}>
                      <span
                        className={`document-icon ${d.type === "pdf" ? "rose" : d.type === "md" ? "blue" : "green"}`}
                      >
                        <FileText size={21} />
                      </span>
                      <span>
                        <strong>{d.name}</strong>
                        <small>
                          {d.type.toUpperCase()} · {prettySize(d.size)} ·{" "}
                          {d.chunks.length} passages
                          {d.sample ? " · Example" : ""}
                        </small>
                      </span>
                    </button>
                    <span className="topic-tag">{d.topic}</span>
                    <span
                      className={`document-status ${d.status === "ready" ? "published" : "draft"}`}
                    >
                      <span />
                      {d.status === "ready" ? "Published" : "Draft"}
                    </span>
                    <span className="date-cell">
                      {new Date(d.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="row-menu">
                      <button
                        className="icon-button"
                        aria-label={`Actions for ${d.name}`}
                        onClick={() =>
                          setDocMenu(docMenu === d.id ? null : d.id)
                        }
                      >
                        <MoreHorizontal size={19} />
                      </button>
                      {docMenu === d.id && (
                        <div className="dropdown-menu">
                          <button
                            onClick={() => {
                              setSource(d);
                              setDocMenu(null);
                            }}
                          >
                            <BookOpen size={14} /> View source
                          </button>
                          <a
                            href={`/api/source?id=${d.id}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download size={14} /> Download
                          </a>
                          <button onClick={() => changeDocument(d)}>
                            <CheckCircle2 size={14} />
                            {d.status === "ready" ? "Move to draft" : "Publish"}
                          </button>
                          <button onClick={() => changeDocument(d, true)}>
                            <RotateCw size={14} /> Index in Qdrant
                          </button>
                          <button
                            className="danger"
                            onClick={() => {
                              setConfirmDelete(d);
                              setDocMenu(null);
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="library-foot">
              <Info size={14} />
              <span>
                Only published documents are available to assistants. Example
                documents are illustrative.
              </span>
            </div>
          </div>
        )}
        {view === "agents" && (
          <div className="content-page">
            <div className="page-heading">
              <div>
                <div className="eyebrow">THE RIGHT EXPERTISE, EVERY TIME</div>
                <h1>Your agents</h1>
                <p>
                  Specialized assistants. Shared knowledge. A defined scope.
                </p>
              </div>
              <button
                className="primary-button"
                onClick={() =>
                  setEditing({
                    id: crypto.randomUUID(),
                    name: "New assistant",
                    description: "A focused assistant for your team.",
                    topic: "General",
                    instructions:
                      "Answer only from the provided sources. Cite evidence and ask for clarification when needed.",
                    color: "purple",
                    icon: "sparkles",
                    enabled: true,
                  })
                }
              >
                <Plus size={17} /> Create agent
              </button>
            </div>
            <div className="agent-grid">
              {workspace.agents.map((a) => (
                <article className="agent-card" key={a.id}>
                  <div className="agent-card-top">
                    <span className={`agent-large ${a.color}`}>
                      <AgentIcon agent={a} size={25} />
                    </span>
                    <span
                      className={`document-status ${a.enabled ? "published" : "draft"}`}
                    >
                      <span />
                      {a.enabled ? "Active" : "Paused"}
                    </span>
                  </div>
                  <h2>{a.name}</h2>
                  <p>{a.description}</p>
                  <div className="agent-details">
                    <span>
                      <Library size={14} />
                      {a.topic === "all" ? "All published knowledge" : a.topic}
                    </span>
                    <span>
                      <ShieldCheck size={14} />
                      Source-grounded answers
                    </span>
                  </div>
                  <div className="agent-card-bottom">
                    <button
                      className="text-button"
                      onClick={() => setEditing({ ...a })}
                    >
                      <Settings2 size={14} /> Configure
                    </button>
                    <button
                      disabled={!a.enabled || busy}
                      onClick={() => newChat(a.id)}
                    >
                      Start chat <ArrowUpRight size={15} />
                    </button>
                  </div>
                </article>
              ))}
              <button
                className="new-agent-card"
                onClick={() =>
                  setEditing({
                    id: crypto.randomUUID(),
                    name: "New assistant",
                    description: "A focused assistant for your team.",
                    topic: "General",
                    instructions:
                      "Answer only from the provided sources. Cite evidence and ask for clarification when needed.",
                    color: "purple",
                    icon: "sparkles",
                    enabled: true,
                  })
                }
              >
                <span>
                  <Plus size={23} />
                </span>
                <strong>A new perspective</strong>
                <p>
                  Create an assistant for a specific topic,
                  <br />
                  product, or area of expertise.
                </p>
              </button>
            </div>
            <div className="info-panel">
              <ShieldCheck size={21} />
              <div>
                <strong>Specialization starts with scope</strong>
                <p>
                  Each agent searches published documents within its topic.
                  Instructions shape the answer; they don’t expand access to
                  other topics.
                </p>
              </div>
            </div>
          </div>
        )}
        {view === "connections" && (
          <div className="content-page connections-page">
            <div className="page-heading">
              <div>
                <div className="eyebrow">YOUR MODELS. YOUR INFRASTRUCTURE.</div>
                <h1>Connections</h1>
                <p>Choose how your knowledge becomes an answer.</p>
              </div>
              <button
                className="primary-button"
                disabled={savingSettings}
                onClick={saveConnections}
              >
                {savingSettings ? (
                  <Loader2 className="spin" size={16} />
                ) : (
                  <Check size={16} />
                )}
                Save preferences
              </button>
            </div>
            <div className="connection-columns">
              <div>
                <section className="settings-card">
                  <div className="section-head">
                    <span className="stat-icon green">
                      <Sparkles size={20} />
                    </span>
                    <div>
                      <h2>AI gateway</h2>
                      <p>One workspace. Your choice of model.</p>
                    </div>
                  </div>
                  <div className="provider-options">
                    {[
                      {
                        id: "demo",
                        name: "Source preview",
                        description: "Explore your sources without an LLM",
                        status: true,
                      },
                      {
                        id: "openai",
                        name: "OpenAI",
                        description: "Connect through your OpenAI account",
                        status: connections?.openai,
                      },
                      {
                        id: "openrouter",
                        name: "OpenRouter",
                        description: "Access models through a shared API",
                        status: connections?.openrouter,
                      },
                      {
                        id: "local",
                        name: "Local model",
                        description: "Your own OpenAI-compatible endpoint",
                        status: connections?.local,
                      },
                    ].map((p) => (
                      <button
                        key={p.id}
                        className={`provider-option ${settings.provider === p.id ? "selected" : ""}`}
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            provider: p.id as Settings["provider"],
                            model:
                              p.id === "demo"
                                ? ""
                                : s.provider === p.id
                                  ? s.model
                                  : "",
                          }))
                        }
                      >
                        <span className="radio-circle">
                          {settings.provider === p.id && <span />}
                        </span>
                        <span>
                          <strong>{p.name}</strong>
                          <small>{p.description}</small>
                        </span>
                        <span
                          className={`connection-state ${p.status ? "configured" : ""}`}
                        >
                          {p.id === "demo"
                            ? "Available"
                            : p.status
                              ? "Configured"
                              : "Not configured"}
                        </span>
                      </button>
                    ))}
                  </div>
                  {settings.provider !== "demo" && (
                    <label className="field">
                      Model identifier
                      <input
                        placeholder={
                          settings.provider === "local"
                            ? "Your server’s loaded model name"
                            : settings.provider === "openrouter"
                              ? "provider/model-name"
                              : "Model identifier from your provider"
                        }
                        value={settings.model}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, model: e.target.value }))
                        }
                      />
                      <small>
                        Use the exact model identifier supported by your
                        endpoint.
                      </small>
                    </label>
                  )}
                  <div className="field">
                    <label>
                      Response temperature{" "}
                      <span>{settings.temperature.toFixed(1)}</span>
                    </label>
                    <input
                      aria-label="Response temperature"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.temperature}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          temperature: Number(e.target.value),
                        }))
                      }
                    />
                    <div className="range-labels">
                      <span>More focused</span>
                      <span>More varied</span>
                    </div>
                  </div>
                  <div className="toggle-row">
                    <div>
                      <strong>Local-only model routing</strong>
                      <p>Block cloud chat and embedding calls.</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={settings.localOnly}
                      aria-label="Local-only model routing"
                      className={`toggle ${settings.localOnly ? "on" : ""}`}
                      onClick={() =>
                        setSettings((s) => ({ ...s, localOnly: !s.localOnly }))
                      }
                    >
                      <span />
                    </button>
                  </div>
                </section>
                <section className="settings-card">
                  <div className="section-head">
                    <span className="stat-icon blue">
                      <Search size={20} />
                    </span>
                    <div>
                      <h2>Knowledge retrieval</h2>
                      <p>How assistants find relevant passages.</p>
                    </div>
                  </div>
                  <label className="field">
                    Search method
                    <select
                      value={settings.retrieval}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          retrieval: e.target.value as Settings["retrieval"],
                        }))
                      }
                    >
                      <option value="keyword">
                        Keyword search — available now
                      </option>
                      <option value="qdrant">
                        Qdrant vector search — requires configuration
                      </option>
                    </select>
                  </label>
                  <p className="settings-note">
                    Vector search needs Qdrant, an embedding endpoint, and
                    indexed documents. Use each document’s menu to index
                    existing sources.
                  </p>
                </section>
              </div>
              <div>
                <section className="settings-card stack-card">
                  <div className="section-head">
                    <span className="stat-icon purple">
                      <Network size={20} />
                    </span>
                    <div>
                      <h2>Your stack</h2>
                      <p>Server-side connection status.</p>
                    </div>
                  </div>
                  {[
                    {
                      icon: Database,
                      name: "Application database",
                      value: connections?.database || "Loading…",
                      ok: !!connections,
                    },
                    {
                      icon: Layers,
                      name: "Qdrant",
                      value: connections?.qdrant
                        ? "Endpoint configured"
                        : "Not configured",
                      ok: connections?.qdrant,
                    },
                    {
                      icon: HardDrive,
                      name: "File storage",
                      value: connections?.storage || "Loading…",
                      ok:
                        !!connections &&
                        connections.storage !== "Not configured",
                    },
                    {
                      icon: Network,
                      name: "Embedding provider",
                      value: connections?.embeddingModel || "Not configured",
                      ok: connections?.embeddings,
                    },
                    {
                      icon: Bot,
                      name: "LangChain",
                      value: "Model and retrieval orchestration",
                      ok: true,
                    },
                    {
                      icon: Settings2,
                      name: "ONNX Runtime",
                      value: "Optional · not enabled",
                      ok: false,
                    },
                  ].map((x) => (
                    <div className="stack-item" key={x.name}>
                      <x.icon size={18} />
                      <div>
                        <strong>{x.name}</strong>
                        <small>{x.value}</small>
                      </div>
                      <span className={`status-dot ${x.ok ? "" : "muted"}`} />
                    </div>
                  ))}
                  <div className="stack-note">
                    <Info size={14} />
                    Configured means credentials are present; it is not a live
                    health check.
                  </div>
                </section>
                <section className="setup-card">
                  <ShieldCheck size={22} />
                  <h3>Credentials stay server-side</h3>
                  <p>
                    Set API keys and endpoint URLs in your deployment
                    environment. They are never sent to the browser.
                  </p>
                  <button onClick={() => setShowSetup(true)}>
                    View setup guide <ArrowUpRight size={14} />
                  </button>
                </section>
              </div>
            </div>
          </div>
        )}
      </main>
      {toast && (
        <div className="toast" role="status">
          <Info size={17} />
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {upload && (
        <Modal
          title="Add to your knowledge"
          subtitle="Give your assistants something worth knowing."
          onClose={() => {
            if (!uploading) setUpload(false);
          }}
        >
          <div className="modal-body">
            <div className="segmented">
              <button
                className={uploadMode === "file" ? "active" : ""}
                onClick={() => setUploadMode("file")}
              >
                <Upload size={15} />
                Upload a file
              </button>
              <button
                className={uploadMode === "text" ? "active" : ""}
                onClick={() => setUploadMode("text")}
              >
                <SquarePen size={15} />
                Paste text
              </button>
            </div>
            {uploadMode === "file" ? (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.md,.markdown,.txt,.csv,.png,.jpg,.jpeg,.webp"
                  style={{ display: "none" }}
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
                <button
                  className={`upload-zone ${uploadFile ? "has-file" : ""}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    setUploadFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                >
                  <span className="upload-icon">
                    {uploadFile ? <FileText size={25} /> : <Upload size={25} />}
                  </span>
                  <strong>
                    {uploadFile
                      ? uploadFile.name
                      : "Choose a file or drop it here"}
                  </strong>
                  <span>
                    {uploadFile
                      ? `${prettySize(uploadFile.size)} · Click to change`
                      : "PDF, Markdown, TXT, CSV or images · Up to 5 MB"}
                  </span>
                </button>
                <p className="settings-note">
                  Text-based PDFs are supported. Images need a connected vision
                  model; scanned PDFs need an OCR service.
                </p>
              </>
            ) : (
              <>
                <label className="field">
                  Document name
                  <input
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="e.g. Product onboarding.md"
                    maxLength={180}
                  />
                </label>
                <label className="field">
                  Knowledge text
                  <textarea
                    rows={7}
                    value={uploadText}
                    onChange={(e) => setUploadText(e.target.value)}
                    placeholder="Paste a guide, a formula with its explanation, or a question and answer…"
                    maxLength={250000}
                  />
                </label>
              </>
            )}
            <label className="field">
              Topic
              <select
                value={uploadTopic}
                onChange={(e) => setUploadTopic(e.target.value)}
              >
                {Array.from(
                  new Set([
                    "General",
                    "Battery science",
                    "User guides",
                    ...workspace.agents
                      .filter((a) => a.topic !== "all")
                      .map((a) => a.topic),
                    ...workspace.documents.map((d) => d.topic),
                  ]),
                ).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <small>
                Specialists search documents in their assigned topic.
              </small>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={draft}
                onChange={(e) => setDraft(e.target.checked)}
              />
              <span>
                <strong>Save as draft</strong>
                <small>Keep it out of answers until you publish it.</small>
              </span>
            </label>
            {uploadError && (
              <div className="form-error" role="alert">
                <AlertCircle size={16} />
                {uploadError}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              className="secondary-button"
              disabled={uploading}
              onClick={() => setUpload(false)}
            >
              Cancel
            </button>
            <button
              className="primary-button"
              disabled={uploading}
              onClick={addDocument}
            >
              {uploading ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <Plus size={16} />
              )}{" "}
              {uploading
                ? "Processing document…"
                : draft
                  ? "Save draft"
                  : "Add knowledge"}
            </button>
          </div>
        </Modal>
      )}
      {editing && (
        <Modal
          title="Configure assistant"
          subtitle="A clear role makes a better conversation."
          onClose={() => setEditing(null)}
        >
          <div className="modal-body">
            <label className="field">
              Name
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                maxLength={80}
              />
            </label>
            <label className="field">
              Description
              <input
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                maxLength={300}
              />
            </label>
            <label className="field">
              Knowledge topic
              <input
                value={editing.topic}
                onChange={(e) =>
                  setEditing({ ...editing, topic: e.target.value })
                }
                maxLength={100}
                list="topics"
              />
              <datalist id="topics">
                {[
                  "all",
                  "General",
                  "Battery science",
                  "User guides",
                  ...new Set(workspace.documents.map((d) => d.topic)),
                ].map((t, i) => (
                  <option key={`${t}-${i}`} value={t} />
                ))}
              </datalist>
              <small>
                Use “all” for every published topic, or match a document topic
                exactly.
              </small>
            </label>
            <label className="field">
              Instructions
              <textarea
                rows={5}
                value={editing.instructions}
                onChange={(e) =>
                  setEditing({ ...editing, instructions: e.target.value })
                }
                maxLength={5000}
              />
            </label>
            <div className="toggle-row">
              <div>
                <strong>Assistant active</strong>
                <p>Available for new conversations.</p>
              </div>
              <button
                className={`toggle ${editing.enabled ? "on" : ""}`}
                role="switch"
                aria-checked={editing.enabled}
                aria-label="Assistant active"
                onClick={() =>
                  setEditing({ ...editing, enabled: !editing.enabled })
                }
              >
                <span />
              </button>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="secondary-button"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
            <button
              className="primary-button"
              disabled={
                saving ||
                !editing.name.trim() ||
                !editing.instructions.trim() ||
                !editing.topic.trim()
              }
              onClick={saveAgent}
            >
              {saving ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <Check size={16} />
              )}
              Save assistant
            </button>
          </div>
        </Modal>
      )}
      {source && (
        <Modal
          title={source.name}
          subtitle={
            "chunks" in source
              ? `${source.topic} · ${source.chunks.length} passages${source.sample ? " · Illustrative example" : ""}`
              : `Source excerpt · page ${source.page}`
          }
          onClose={() => setSource(null)}
          wide
        >
          <div className="source-content">
            {"chunks" in source ? (
              source.chunks.map((c, i) => (
                <section key={c.id}>
                  <div className="source-location">
                    PAGE {c.page} <span>PASSAGE {i + 1}</span>
                  </div>
                  <div className="source-text">{c.text}</div>
                </section>
              ))
            ) : (
              <section>
                <div className="source-location">PAGE {source.page}</div>
                <div className="source-text">{source.text}</div>
              </section>
            )}
          </div>
          <div className="modal-footer">
            <span className="settings-note">
              Original content, preserved for reference.
            </span>
            <a
              className="secondary-button"
              href={`/api/source?id=${"chunks" in source ? source.id : source.documentId}`}
              target="_blank"
              rel="noreferrer"
            >
              <Download size={15} />
              Download source
            </a>
          </div>
        </Modal>
      )}
      {citationMessage && (
        <Modal
          title="Sources behind this answer"
          subtitle="Inspect the passages retrieved for this response."
          onClose={() => setCitationMessage(null)}
          wide
        >
          <div className="modal-body citation-list">
            {citationMessage.citations?.map((c, i) => (
              <button
                key={`${c.documentId}-${i}`}
                onClick={() => {
                  setSource(c);
                  setCitationMessage(null);
                }}
              >
                <span className="citation-number">{i + 1}</span>
                <div>
                  <strong>{c.name}</strong>
                  <small>Page {c.page}</small>
                  <p>
                    {c.text.slice(0, 280)}
                    {c.text.length > 280 ? "…" : ""}
                  </p>
                </div>
                <ArrowUpRight size={17} />
              </button>
            ))}
          </div>
        </Modal>
      )}
      {confirmDelete && (
        <Modal
          title="Delete this document?"
          subtitle={confirmDelete.name}
          onClose={() => setConfirmDelete(null)}
        >
          <div className="modal-body">
            <p className="delete-copy">
              The document and its search index will be removed. Existing
              conversations retain their source excerpts.
            </p>
          </div>
          <div className="modal-footer">
            <button
              className="secondary-button"
              onClick={() => setConfirmDelete(null)}
            >
              Keep document
            </button>
            <button className="danger-button" onClick={deleteDocument}>
              <Trash2 size={15} />
              Delete document
            </button>
          </div>
        </Modal>
      )}
      {showSetup && (
        <Modal
          title="Your knowledge workspace"
          subtitle="A working foundation for a focused knowledge assistant."
          onClose={() => setShowSetup(false)}
          wide
        >
          <div className="modal-body setup-guide">
            <div className="setup-notice">
              <ShieldCheck size={19} />
              <p>
                This version is a private, single-owner workspace. Customer and
                internal-user role separation is not implemented.
              </p>
            </div>
            <h3>Start with your knowledge</h3>
            <p>
              Upload a text-based PDF, Markdown, or text file. Publish it,
              select an assistant with a matching topic, and ask a specific
              question. Use <code>/ingest</code> in chat to open ingestion.
            </p>
            <h3>Connect a model</h3>
            <p>
              Configure the server environment, choose a provider in
              Connections, enter its model identifier, and save preferences.
              Source preview works without a model API.
            </p>
            <div className="env-table">
              <div>
                <strong>OpenAI</strong>
                <code>OPENAI_API_KEY</code>
              </div>
              <div>
                <strong>OpenRouter</strong>
                <code>OPENROUTER_API_KEY</code>
              </div>
              <div>
                <strong>Local model</strong>
                <code>LOCAL_LLM_BASE_URL</code>
              </div>
              <div>
                <strong>Embeddings</strong>
                <code>
                  EMBEDDING_BASE_URL
                  <br />
                  EMBEDDING_MODEL
                  <br />
                  EMBEDDING_API_KEY
                </code>
              </div>
              <div>
                <strong>Vector database</strong>
                <code>
                  QDRANT_URL
                  <br />
                  QDRANT_API_KEY
                </code>
              </div>
              <div>
                <strong>PostgreSQL</strong>
                <code>DATABASE_URL</code>
              </div>
            </div>
            <p className="settings-note">
              The local app uses file-backed demo records and local uploads by
              default. PostgreSQL and Azure Blob adapters are included.
              Configure and initialize PostgreSQL before switching.
            </p>
            <h3>What’s optional?</h3>
            <p>
              ONNX is not enabled. You can add an ONNX-backed embedding endpoint
              without changing the chat interface. This first version processes
              bounded uploads during the request; large-scale background
              ingestion is a future extension.
            </p>
          </div>
          <div className="modal-footer">
            <button
              className="primary-button"
              onClick={() => {
                setShowSetup(false);
                navigate("connections");
              }}
            >
              Open connections <ArrowRight size={15} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

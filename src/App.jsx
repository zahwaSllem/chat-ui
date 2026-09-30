import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const CHATS_KEY = "chats";
const ACTIVE_KEY = "activeChatId";
const THEME_KEY = "chat-zahwa:theme";
const LEGACY_KEYS = ["chat-messages", "chat-zahwa:messages"];
const NEW_CHAT_TITLE = "محادثة جديدة";

function makeChat(messages = []) {
  const first = messages.find((m) => m.role === "user");
  return {
    id: crypto.randomUUID(),
    title: first ? first.text.trim().slice(0, 30) : "",
    messages,
    createdAt: Date.now(),
  };
}

function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

// Reads saved chats; moves an old single-conversation key into the first chat.
// Pure (no removals) so it is safe under StrictMode; legacy keys are removed after saving.
function loadState() {
  let chats = readJSON(CHATS_KEY);
  chats = Array.isArray(chats) ? chats : [];

  if (chats.length === 0) {
    for (const key of LEGACY_KEYS) {
      const legacy = readJSON(key);
      if (Array.isArray(legacy) && legacy.length > 0) {
        chats = [makeChat(legacy)];
        break;
      }
    }
  }
  if (chats.length === 0) chats = [makeChat()];

  let activeId = null;
  try {
    activeId = localStorage.getItem(ACTIVE_KEY);
  } catch {
    // ignore
  }
  if (!chats.some((c) => c.id === activeId)) activeId = chats[0].id;
  return { chats, activeId };
}

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // ignore
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const newestFirst = (a, b) => b.createdAt - a.createdAt;
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function App() {
  const [initial] = useState(loadState);
  const [chats, setChats] = useState(initial.chats);
  const [activeId, setActiveId] = useState(initial.activeId);
  const [input, setInput] = useState("");
  const [loadingIds, setLoadingIds] = useState([]);
  const [theme, setTheme] = useState(loadTheme);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeId) ?? chats[0];
  const messages = activeChat.messages;
  const loading = loadingIds.includes(activeChat.id);
  const sortedChats = [...chats].sort(newestFirst);

  // Auto-scroll to the latest message (and to the typing indicator)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, activeChat.id]);

  // Persist chats and the active chat id, then drop the legacy keys
  useEffect(() => {
    try {
      localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
      localStorage.setItem(ACTIVE_KEY, activeChat.id);
      LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      // storage full or unavailable
    }
  }, [chats, activeChat.id]);

  // Apply and persist the theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  async function send() {
    if (!input.trim() || loading) return;

    const chatId = activeChat.id;
    const newMessages = [...messages, { role: "user", text: input }];

    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, title: c.title || input.trim().slice(0, 30), messages: newMessages }
          : c
      )
    );
    setInput("");
    setLoadingIds((ids) => [...ids, chatId]);

    let reply;
    try {
      const res = await fetch(`${API_URL}/chat`,  {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      reply = data.reply;
    } catch {
      reply = "مقدرتش أوصل للسيرفر، اتأكدي إنه شغال.";
    }

    // Goes to the chat it was sent from, even if the user switched away or deleted it
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, messages: [...c.messages, { role: "model", text: reply }] } : c
      )
    );
    setLoadingIds((ids) => ids.filter((id) => id !== chatId));
    inputRef.current?.focus();
  }

  function newChat() {
    setSidebarOpen(false);
    setInput("");
    // Reuse the current chat if it is already empty instead of piling up blank ones
    if (messages.length === 0) {
      inputRef.current?.focus();
      return;
    }
    const chat = makeChat();
    setChats((prev) => [chat, ...prev]);
    setActiveId(chat.id);
    inputRef.current?.focus();
  }

  function openChat(id) {
    setActiveId(id);
    setInput("");
    setSidebarOpen(false);
  }

  function deleteChat(id) {
    if (!window.confirm("مسح المحادثة دي؟")) return;
    const remaining = chats.filter((c) => c.id !== id);
    if (remaining.length === 0) {
      const chat = makeChat();
      setChats([chat]);
      setActiveId(chat.id);
      return;
    }
    setChats(remaining);
    if (id === activeChat.id) setActiveId([...remaining].sort(newestFirst)[0].id);
  }

  return (
    <div dir="rtl" className="app">
      {sidebarOpen && <div className="backdrop" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="new-chat-btn" onClick={newChat}>
          + {NEW_CHAT_TITLE}
        </button>
        <ul className="chat-list">
          {sortedChats.map((c) => (
            <li key={c.id} className={`chat-item ${c.id === activeChat.id ? "active" : ""}`}>
              <button
                className="chat-item-title"
                dir="auto"
                onClick={() => openChat(c.id)}
                aria-current={c.id === activeChat.id ? "true" : undefined}
              >
                {c.title || NEW_CHAT_TITLE}
              </button>
              <button
                className="chat-item-delete"
                onClick={() => deleteChat(c.id)}
                title="مسح"
                aria-label="مسح المحادثة"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="page">
        <header className="header">
          <button
            className="icon-btn menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="القائمة"
          >
            ☰
          </button>
          <h1 className="title">Chat Zahwa</h1>
          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
              aria-label="تبديل الوضع"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        <main className="chat">
          {messages.length === 0 && !loading && (
            <div className="empty">
              <div className="empty-icon">💬</div>
              <p>ابدئي المحادثة بكتابة رسالة</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} dir="auto" className={`bubble ${m.role === "user" ? "user" : "bot"}`}>
              <ReactMarkdown>{m.text}</ReactMarkdown>
            </div>
          ))}

          {loading && (
            <div className="bubble bot typing" aria-label="بيكتب...">
              <span />
              <span />
              <span />
            </div>
          )}

          <div ref={bottomRef} />
        </main>

        <footer className="input-row">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="اكتبي رسالتك..."
            className="input"
            autoFocus
          />
          <button onClick={send} disabled={loading || !input.trim()} className="send-btn">
            إرسال
          </button>
        </footer>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const STORAGE_KEY = "chat-zahwa:messages";
const THEME_KEY = "chat-zahwa:theme";

function loadMessages() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
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

export default function App() {
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(loadTheme);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the latest message (and to the typing indicator)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  // Persist the conversation
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // storage full or unavailable
    }
  }, [messages]);

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

    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "model", text: data.reply }]);
    } catch {
      setMessages([...newMessages, { role: "model", text: "مقدرتش أوصل للسيرفر، اتأكدي إنه شغال." }]);
    }

    setLoading(false);
    inputRef.current?.focus();
  }

  function newChat() {
    if (loading) return;
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div dir="rtl" className="page">
      <header className="header">
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
          <button className="new-chat-btn" onClick={newChat} disabled={loading || messages.length === 0}>
            + محادثة جديدة
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
  );
}

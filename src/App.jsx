import { useState } from "react";
import ReactMarkdown from "react-markdown";
export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
  }

  return (
    <div dir="rtl" style={styles.page}>
      <h1 style={styles.title}>Chat Zahwa</h1>

      <div style={styles.chat}>
        {messages.map((m, i) => (
           <div key={i} dir="auto" style={m.role === "user" ? styles.user : styles.bot}>
            <ReactMarkdown>{m.text}</ReactMarkdown>
          </div>
        ))}
        {loading && <div style={styles.bot}>بيفكر...</div>}
      </div>

      <div style={styles.inputRow}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="اكتبي رسالتك..."
          style={styles.input}
        />
        <button onClick={send} disabled={loading} style={styles.button}>
          إرسال
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 600, margin: "0 auto", padding: 20, height: "100vh", boxSizing: "border-box", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif" },
  title: { textAlign: "center", fontSize: 24 },
  chat: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: 12, background: "#f3f2f8", borderRadius: 14 },
  user: { alignSelf: "flex-start", background: "#6c5ce7", color: "white", padding: "10px 14px", borderRadius: 16, maxWidth: "80%" },
  bot: { alignSelf: "flex-end", background: "white", color: "#222", padding: "10px 14px", borderRadius: 16, maxWidth: "80%", whiteSpace: "pre-wrap" },
  inputRow: { display: "flex", gap: 8, marginTop: 12 },
  input: { flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ccc", fontSize: 16 },
  button: { padding: "12px 20px", borderRadius: 10, border: "none", background: "#6c5ce7", color: "white", fontSize: 16, cursor: "pointer" },
};
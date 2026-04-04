import { useRef, useEffect } from "react";

const font = "'EB Garamond', 'Garamond', 'Georgia', serif";
const fontDisplay = "'Cormorant Garamond', 'Garamond', serif";
const fontMono = "'JetBrains Mono', 'Menlo', monospace";
const gold = "#C9A96E";
const goldDim = "rgba(201,169,110,";

const STARTERS = [
  { text: "What's happening in the world right now?", icon: "\u25c9" },
  { text: "Challenge something I believe", icon: "\u25c8" },
  { text: "Make the case against religion", icon: "\u25b3" },
  { text: "When is it right to go to war?", icon: "\u25c7" },
  { text: "What should I be reading?", icon: "\u25a7" },
  { text: "Is free speech really absolute?", icon: "\u25ce" },
];

export default function ChatView({ messages, loading, searchState, input, onInputChange, onSend }) {
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const showStarters = messages.length <= 2 && !loading;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend(input);
    }
  };

  const handleChange = (e) => {
    onInputChange(e.target.value);
    e.target.style.height = "22px";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0908", color: "#DAD0C2", fontFamily: font, display: "flex", flexDirection: "column", height: "100vh" }}>
      <style>{`
        @keyframes ember { 0%,100% { opacity:.4; transform:scale(1); } 50% { opacity:1; transform:scale(1.6); } }
        @keyframes breathe { 0%,100% { opacity:.5; } 50% { opacity:1; } }
        textarea::placeholder { color: #3D362C; }
        textarea:focus { border-color: ${goldDim}0.3) !important; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Top bar */}
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${goldDim}0.08)`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: gold, boxShadow: `0 0 8px 2px ${goldDim}0.3)`, animation: "ember 4s ease-in-out infinite" }} />
        <span style={{ fontSize: 14, fontWeight: 600, fontFamily: fontDisplay, color: "#B8A88E", letterSpacing: "0.3px" }}>
          The Contrarian Mind
        </span>
        {searchState && (
          <span style={{ marginLeft: "auto", fontSize: 9, fontFamily: fontMono, color: gold, letterSpacing: 2, animation: "breathe 1.5s ease-in-out infinite", textTransform: "uppercase" }}>
            searching
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
        {messages.map((m, i) => (
          m.role === "assistant" ? (
            <div key={i} style={{ maxWidth: "92%", marginBottom: 24, paddingLeft: 14, borderLeft: `2px solid ${goldDim}0.2)`, animation: "fadeIn 0.4s ease" }}>
              {m.content.split("\n").filter(Boolean).map((p, j) => (
                <p key={j} style={{ fontSize: 16, lineHeight: 1.8, color: "#D4C8B6", margin: j === 0 ? 0 : "12px 0 0" }}>{p}</p>
              ))}
            </div>
          ) : (
            <div key={i} style={{ maxWidth: "82%", marginLeft: "auto", marginBottom: 18, background: `${goldDim}0.05)`, borderRadius: "14px 14px 3px 14px", padding: "12px 16px", animation: "fadeIn 0.3s ease" }}>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "#B8AE9E", margin: 0 }}>{m.content}</p>
            </div>
          )
        ))}
        {loading && (
          <div style={{ paddingLeft: 14, marginBottom: 20, borderLeft: `2px solid ${goldDim}0.1)`, animation: "fadeIn 0.3s ease" }}>
            <p style={{ color: "#5A4F42", fontStyle: "italic", fontSize: 14, margin: 0 }}>
              {searchState ? "reading the world, forming a view..." : "thinking..."}
            </p>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Starter chips */}
      {showStarters && (
        <div style={{ padding: "0 16px 8px", display: "flex", flexWrap: "wrap", gap: 7 }}>
          {STARTERS.map((s, i) => (
            <button
              key={i}
              onClick={() => onSend(s.text)}
              style={{ background: `${goldDim}0.03)`, border: `1px solid ${goldDim}0.1)`, color: "#7B6F5F", fontSize: 13, padding: "9px 14px", borderRadius: 20, cursor: "pointer", fontFamily: font, transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${goldDim}0.3)`; e.currentTarget.style.color = "#B8A88E"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${goldDim}0.1)`; e.currentTarget.style.color = "#7B6F5F"; }}
            >
              <span style={{ fontFamily: fontMono, fontSize: 10, color: `${goldDim}0.35)` }}>{s.icon}</span>
              {s.text}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "10px 16px 28px", borderTop: `1px solid ${goldDim}0.06)`, display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0 }}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          placeholder="Speak your mind..."
          style={{ flex: 1, background: `${goldDim}0.03)`, border: `1px solid ${goldDim}0.1)`, borderRadius: 10, padding: "14px 16px", color: "#DAD0C2", fontSize: 15, fontFamily: font, outline: "none", resize: "none", lineHeight: 1.5, minHeight: 22, maxHeight: 140, transition: "border-color 0.2s" }}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={() => onSend(input)}
          disabled={loading || !input.trim()}
          style={{ background: loading ? `${goldDim}0.12)` : `${goldDim}0.65)`, border: "none", color: loading ? "#6B5F50" : "#0A0908", width: 46, height: 46, borderRadius: 10, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, fontWeight: 700, transition: "all 0.2s" }}
        >
          →
        </button>
      </div>
    </div>
  );
}

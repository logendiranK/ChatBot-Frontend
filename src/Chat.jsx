import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./css/Chat.css";

const parseMessageContent = (text = "") => {
  const parts = [];
  const regex = /```(?:\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex, match.index).trim(),
      });
    }

    parts.push({
      type: "code",
      content: match[1].trim(),
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      content: text.slice(lastIndex).trim(),
    });
  }

  return parts.filter((p) => p.content !== "");
};

function Chat() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Always start with empty chat on first load
  useEffect(() => {
    setChat([]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = {
      sender: "user",
      text: input,
      senderName: "You",
    };

    setChat((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/chat", {
        message: input,
      });

      const botMsg = {
        sender: "bot",
        text: res.data.reply,
        senderName: "ZenAI",
      };

      setChat((prev) => [...prev, botMsg]);
    } catch (err) {
      setChat((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "ZenAI is confused... Try again!",
          senderName: "ZenAI",
        },
      ]);
    }

    setLoading(false);
    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const handleNewChat = () => {
    setChat([]);
    setInput("");
  };

  const showEmptyState = useMemo(
    () => !loading && chat.length === 0,
    [loading, chat.length]
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <p className="app-badge">ZenAI</p>
          <h1 className="app-title">Conversational AI Interface</h1>
          <p className="app-subtitle">
            🛡 Chat resets every time you refresh or start a new chat.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="new-chat-btn"
            onClick={handleNewChat}
            disabled={loading}
          >
            + New Chat
          </button>

          <div className={`status-pill ${loading ? "busy" : "ready"}`}>
            <span className="status-dot" />
            {loading ? "Thinking" : "Live"}
          </div>
        </div>
      </header>

      <div className="chat-box">
        {showEmptyState && (
          <div className="empty-state">
            <h3>Start your first conversation</h3>
            <p>Ask anything.</p>
          </div>
        )}

        {chat.map((msg, idx) => {
          const messageChunks = parseMessageContent(msg.text);

          return (
            <div
              key={idx}
              className={`chat-message ${
                msg.sender === "user" ? "user-text" : "bot-text"
              }`}
            >
              <span className="chat-sender">
                <b>{msg.sender === "user" ? "You" : "ZenAI"}:</b>
              </span>

              {messageChunks.map((chunk, chunkIdx) =>
                chunk.type === "code" ? (
                  <pre key={chunkIdx} className="code-block">
                    <code>{chunk.content}</code>
                  </pre>
                ) : (
                  <div key={chunkIdx} className="chat-text">
                    {chunk.content}
                  </div>
                )
              )}
            </div>
          );
        })}

        {loading && <p className="loading-text">ZenAI is thinking...</p>}
      </div>

      <div className="input-section">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          className="input-box"
          placeholder="Type something here..."
          disabled={loading}
        />

        <button className="send-btn" onClick={sendMessage} disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default Chat;

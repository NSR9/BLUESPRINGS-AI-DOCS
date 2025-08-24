import { useEffect, useRef, useState } from "react";
import useSSE from "../hooks/useSSE";
import { marked } from "marked";

export default function ChatPanel({ sessionId, provider, model, history, onUserSend, onAssistantDelta, onAssistantDone }) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [body, setBody] = useState(null);

  useSSE({
    url: streaming ? `${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/chat/${sessionId}/stream` : null,
    body,
    onDelta: (delta) => onAssistantDelta(delta),
    onDone: () => { setStreaming(false); onAssistantDone(); },
    onError: () => setStreaming(false)
  });

  const onSend = () => {
    if (!input.trim() || !sessionId) return;
    const msg = { role: "user", content: input, provider, model };
    const msgs = [...history, msg];
    onUserSend(msg);
    setBody({ messages: msgs, provider, model });
    setStreaming(true);
    setInput("");
  };

  return (
    <div className="chat">
      <div className="messages">
        {history.map((m, idx) => (
          <div key={idx} className={`msg ${m.role}`}>
            <div dangerouslySetInnerHTML={{__html: marked.parse(m.content || "")}} />
            <button className="copy" onClick={()=>navigator.clipboard.writeText(m.content || "")}>copy</button>
          </div>
        ))}
        {streaming && <div className="cursor">▍</div>}
      </div>
      <div className="composer">
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask anything..." />
        <button onClick={onSend}>Send</button>
        {streaming && <button onClick={()=>setStreaming(false)}>Stop</button>}
      </div>
    </div>
  );
}

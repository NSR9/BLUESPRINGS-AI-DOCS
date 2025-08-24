import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import ModelSwitcher from "./components/ModelSwitcher";
import { createSession, getSession, listSessions } from "./api/client";

function uid() {
  let u = localStorage.getItem("user_id");
  if (!u) { u = crypto.randomUUID(); localStorage.setItem("user_id", u); }
  return u;
}

export default function App() {
  const userId = useRef(uid());
  const [sessions, setSessions] = useState([]);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [pm, setPM] = useState({ provider: "openai", model: "gpt-4o-mini" });

  const refresh = async () => {
    const s = await listSessions(userId.current);
    setSessions(s);
    if (s.length && !current) pick(s[0].id);
  };

  const pick = async (sid) => {
    setCurrent(sid);
    const msgs = await getSession(sid);
    setHistory(msgs);
  };

  const addSession = async () => {
    const res = await createSession(userId.current, "New Chat");
    await refresh();
    setCurrent(res.session_id);
    setHistory([]);
  };

  useEffect(() => { refresh(); }, []);

  const onUserSend = (msg) => setHistory(h => [...h, msg]);
  const onAssistantDelta = (delta) => {
    setHistory(h => {
      const last = h[h.length - 1];
      const prev = h[h.length - 2];
      // append to assistant (create if not exists)
      if (!last || last.role !== "assistant") return [...h, { role: "assistant", content: delta, provider: pm.provider, model: pm.model }];
      const copy = [...h]; copy[copy.length - 1] = { ...last, content: (last.content || "") + delta }; return copy;
    });
  };
  const onAssistantDone = () => {};

  return (
    <div className="layout">
      <Sidebar sessions={sessions} currentId={current} onNew={addSession} onPick={pick} />
      <main>
        <div className="toolbar">
          <ModelSwitcher value={pm} onChange={setPM} />
        </div>
        {current
          ? <ChatPanel sessionId={current} provider={pm.provider} model={pm.model}
                       history={history} onUserSend={onUserSend}
                       onAssistantDelta={onAssistantDelta} onAssistantDone={onAssistantDone} />
          : <div className="empty">Create a new chat to begin.</div>}
      </main>
    </div>
  );
}

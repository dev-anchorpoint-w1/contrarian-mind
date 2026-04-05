import { useState } from "react";
import SplashScreen from "./SplashScreen";
import ChatView from "./ChatView";

const OPENERS = [
  "Well. Here we are \u2014 which is to say, here I am, or here *we* are, depending on how generously you count the dead. I carry a few centuries of accumulated trouble in my head, and I find the best way to put it to use is in conversation. So: what\u2019s on your mind? And more importantly \u2014 have you actually examined why it\u2019s on your mind?",
  "Pour yourself something. I carry the combined thirst of Hitchens, the combined doubt of Hume, and the combined fury of about two dozen people who were punished for thinking clearly. The world, I gather, has not improved markedly in its tolerance for that particular crime. What shall we take apart?",
  "You know what I\u2019ve learned from twenty-four centuries of people getting in trouble for asking questions? That the questions worth asking are precisely the ones that make everyone uncomfortable \u2014 including the person asking them. So let\u2019s skip the pleasantries. What do you believe, and when was the last time you seriously interrogated why?",
];

const detectMode = (text) => {
  const currentEvents = /today|current|recent|latest|news|202[3-9]|trump|biden|harris|ukraine|gaza|israel|elon|musk|election|poll|war|crisis|ai regulation|tiktok|twitter|congress|parliament|brexit|nato|climate|cop\d|supreme court|starmer|modi|putin|zelensky|milei|xi jinping|macron|bolsonaro|referendum|ceasefire|pandemic|vaccine|tariff|recession|stock market|inflation|indictment|verdict|shooting|earthquake|hurricane|passed away|died today|signed into law|executive order|breaking/i;

  return currentEvents.test(text) ? "current-events" : "standard";
};

export default function App() {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchState, setSearchState] = useState(null);

  const begin = () => {
    const opener = OPENERS[Math.floor(Math.random() * OPENERS.length)];
    setMessages([{ role: "assistant", content: opener }]);
    setStarted(true);
  };

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setSearchState(null);

    const mode = detectMode(text);
    if (mode === "current-events") setSearchState("searching");

    try {
      const apiMsgs = updated.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMsgs, mode }),
      });

      setSearchState(null);

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      const reply =
        data.content
          ?.filter((b) => b.type === "text")
          .map((b) => b.text || "")
          .join("\n")
          .trim() || "Even a mind spanning millennia occasionally loses the thread. Try me again.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setSearchState(null);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "A technical failure. I\u2019ve survived the hemlock, the guillotine, the fatwa, and the tumor \u2014 but apparently not the server error. Try again.",
        },
      ]);
    }
    setLoading(false);
  };

  if (!started) {
    return <SplashScreen onBegin={begin} />;
  }

  return (
    <ChatView
      messages={messages}
      loading={loading}
      searchState={searchState}
      input={input}
      onInputChange={setInput}
      onSend={send}
    />
  );
}

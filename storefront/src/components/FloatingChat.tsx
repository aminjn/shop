"use client";

import { useEffect, useRef, useState } from "react";
import { useShop } from "@/lib/store";
import { Chat, Close, Sparkle, Send } from "./Icons";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export function FloatingChat() {
  const { t, locale, chatOpen, setChatOpen } = useShop();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msgs.length === 0)
      setMsgs([{ role: "assistant", content: t.chatWelcome }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.chatWelcome]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  const send = async () => {
    const txt = input.trim();
    if (!txt || loading) return;
    const next = [...msgs, { role: "user" as const, content: txt }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, messages: next }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content: locale === "fa" ? "خطایی رخ داد، دوباره تلاش کنید." : "An error occurred, please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setChatOpen(!chatOpen)}
        aria-label={t.chatTitle}
        className="fixed bottom-6 z-[80] flex h-[60px] w-[60px] items-center justify-center rounded-full border-none text-white"
        style={{ insetInlineEnd: 24, background: "var(--accent)", boxShadow: "0 12px 30px rgba(0,0,0,.28)", cursor: "pointer" }}
      >
        {chatOpen ? <Close size={24} /> : <Chat size={26} />}
      </button>

      {chatOpen && (
        <div
          className="anim-pop fixed bottom-[96px] z-[81] flex h-[540px] w-[380px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[18px]"
          style={{
            insetInlineEnd: 24,
            maxHeight: "calc(100vh - 130px)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 24px 60px rgba(0,0,0,.32)",
          }}
        >
          <div className="flex items-center gap-2.5 p-4 text-white" style={{ background: "var(--accent)" }}>
            <Sparkle size={20} />
            <div>
              <div className="text-[15px] font-extrabold">{t.chatTitle}</div>
              <div className="text-[11.5px] opacity-90">AI • {locale === "fa" ? "آنلاین" : "online"}</div>
            </div>
          </div>

          <div ref={bodyRef} className="scrollthin flex-1 space-y-2.5 overflow-auto p-3.5">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[80%] whitespace-pre-wrap rounded-[14px] px-3.5 py-2.5 text-[13.5px] leading-relaxed"
                  style={
                    m.role === "user"
                      ? { background: "var(--accent)", color: "#fff" }
                      : { background: "var(--surface2)", color: "var(--text)" }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-[14px] px-3.5 py-3" style={{ background: "var(--surface2)" }}>
                  <span className="inline-flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: "var(--muted)", animation: `dots 1.2s ${d * 0.2}s infinite` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-3" style={{ borderTop: "1px solid var(--border)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={t.chatPh}
              className="flex-1 rounded-[10px] px-3 py-2.5 text-[14px] outline-none"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
            <button
              onClick={send}
              aria-label={t.send}
              className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border-none text-white"
              style={{ background: "var(--accent)", cursor: "pointer" }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

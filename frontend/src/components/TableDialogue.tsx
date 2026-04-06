import { useState, useRef, useEffect } from "react";
import type { Table, DialogueMessage } from "../types";
import { dialogueAtTable } from "../api";

interface Props {
  table: Table;
  onBack: () => void;
}

export default function TableDialogue({ table, onBack }: Props) {
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: DialogueMessage = { role: "user", content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await dialogueAtTable(table.id, text, messages);
      setMessages([...newHistory, ...res.messages]);
    } catch {
      setMessages([
        ...newHistory,
        { role: "system", content: "Failed to get response. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      {/* Table Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <button
            onClick={onBack}
            className="mb-2 text-sm text-party-muted hover:text-party-accent transition"
          >
            ← Back to party
          </button>
          <h2 className="text-xl font-bold text-party-accent">{table.name}</h2>
          <p className="text-sm text-party-muted">{table.topic}</p>
        </div>
      </div>

      {/* Participants sidebar + chat */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Participants */}
        <div className="w-64 shrink-0 overflow-y-auto rounded-xl bg-party-card/50 border border-party-accent/10 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-party-gold">
            At this table
          </p>
          <div className="space-y-3">
            {table.references.map((ref, i) => (
              <div key={i} className="rounded-lg bg-party-bg/50 p-3">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-party-text">
                    {ref.authors_full || ref.authors}
                  </p>
                  {ref.url && (
                    <span className="text-green-400/60 text-xs shrink-0" title="Verified">✓</span>
                  )}
                </div>
                {ref.year && (
                  <p className="text-xs text-party-muted">({ref.year})</p>
                )}
                {ref.citation_count != null && (
                  <p className="text-xs text-party-accent/50">{ref.citation_count} citations</p>
                )}
                <p className="mt-1 text-xs text-party-muted italic">
                  "{ref.key_argument}"
                </p>
                {ref.tldr && (
                  <p className="mt-1 text-xs text-party-accent/70">
                    TL;DR: {ref.tldr}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Consensus & Differences */}
          {table.consensus && (
            <div className="mt-4 rounded-lg bg-green-500/10 p-3">
              <p className="text-xs font-medium text-green-400">Consensus</p>
              <p className="mt-1 text-xs text-party-muted">{table.consensus}</p>
            </div>
          )}
          {table.differences && (
            <div className="mt-3 rounded-lg bg-red-500/10 p-3">
              <p className="text-xs font-medium text-red-400">Differences</p>
              <p className="mt-1 text-xs text-party-muted">{table.differences}</p>
            </div>
          )}

          <div className="mt-3 rounded-lg bg-party-accent/10 p-3">
            <p className="text-xs font-medium text-party-accent">Key Debate</p>
            <p className="mt-1 text-xs text-party-muted">{table.key_debate}</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-party-card/30 border border-party-accent/10">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="mb-2 text-lg text-party-muted">
                    You've joined the table
                  </p>
                  <p className="text-sm text-party-muted/60">
                    Share your thoughts or ask a question — the papers at this
                    table will respond.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-party-accent text-white"
                      : msg.role === "system"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-party-card border border-party-accent/10"
                  }`}
                >
                  {msg.role !== "user" && msg.role !== "system" && (
                    <p className="mb-1 text-xs font-semibold text-party-gold">
                      {msg.role}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-party-card border border-party-accent/10 px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-party-accent/50" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-party-accent/50 [animation-delay:0.1s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-party-accent/50 [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-party-accent/10 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Share your thoughts or ask a question..."
                className="flex-1 rounded-xl bg-party-bg border border-party-accent/20 px-4 py-3 text-sm text-party-text placeholder-party-muted/50 outline-none focus:border-party-accent transition"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="rounded-xl bg-party-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-party-accent/80 disabled:opacity-30"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

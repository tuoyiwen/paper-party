import { useState, useRef, useEffect } from "react";
import type { Table, DialogueMessage } from "../types";
import { dialogueAtTable, generateTranscript, generateBilingualSummary, generatePodcast } from "../api";
import PaperTooltip from "./PaperTooltip";
import { canDialogue, recordDialogueRound, getDialogueRemaining, canUseProFeature } from "../plan";

interface Props {
  table: Table;
  onBack: () => void;
}

const CHAT_KEY_PREFIX = "paper-party-chat-";

function loadChat(tableId: string): DialogueMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY_PREFIX + tableId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChat(tableId: string, messages: DialogueMessage[]) {
  localStorage.setItem(CHAT_KEY_PREFIX + tableId, JSON.stringify(messages));
}

export default function TableDialogue({ table, onBack }: Props) {
  const [messages, setMessages] = useState<DialogueMessage[]>(() => loadChat(table.id));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingBilingual, setDownloadingBilingual] = useState(false);
  const [generatingPodcast, setGeneratingPodcast] = useState(false);
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save chat whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChat(table.id, messages);
    }
  }, [messages, table.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    if (!canDialogue(table.id)) {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "You've reached the free plan limit (5 rounds per table). Upgrade to Pro for unlimited dialogue." },
      ]);
      return;
    }

    const userMsg: DialogueMessage = { role: "user", content: text };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await dialogueAtTable(table.id, text, messages);
      recordDialogueRound(table.id);
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

  function handleProFeature(action: () => void) {
    if (canUseProFeature()) {
      action();
    } else {
      setShowUpgradeHint(true);
      setTimeout(() => setShowUpgradeHint(false), 3000);
    }
  }

  function handleExportRawChat() {
    if (messages.length === 0) return;
    let text = `# Chat at "${table.name}"\n`;
    text += `Topic: ${table.topic}\n\n---\n\n`;
    for (const msg of messages) {
      if (msg.role === "user") {
        text += `**You:** ${msg.content}\n\n`;
      } else if (msg.role === "system") {
        text += `_System: ${msg.content}_\n\n`;
      } else {
        text += `**${msg.role}:** ${msg.content}\n\n`;
      }
    }
    downloadFile(text, `${table.name.replace(/[^a-zA-Z0-9]/g, "_")}_chat.md`, "text/markdown");
  }

  async function handleDownloadTranscript() {
    if (messages.length === 0 || downloading) return;
    setDownloading(true);
    try {
      const markdown = await generateTranscript(table.name, table.topic, messages);
      downloadFile(markdown, `${table.name.replace(/[^a-zA-Z0-9]/g, "_")}_transcript.md`, "text/markdown");
    } catch {
      alert("Failed to generate transcript.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadBilingual() {
    if (messages.length === 0 || downloadingBilingual) return;
    setDownloadingBilingual(true);
    try {
      const markdown = await generateBilingualSummary(table.name, table.topic, messages);
      downloadFile(markdown, `${table.name.replace(/[^a-zA-Z0-9]/g, "_")}_bilingual.md`, "text/markdown");
    } catch {
      alert("Failed to generate bilingual summary.");
    } finally {
      setDownloadingBilingual(false);
    }
  }

  async function handleGeneratePodcast() {
    if (messages.length === 0 || generatingPodcast) return;
    setGeneratingPodcast(true);
    try {
      const blob = await generatePodcast(table.name, table.topic, messages);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${table.name.replace(/[^a-zA-Z0-9]/g, "_")}_podcast.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Podcast generation failed. Make sure OPENAI_API_KEY is configured.");
    } finally {
      setGeneratingPodcast(false);
    }
  }

  function handleClearChat() {
    setMessages([]);
    localStorage.removeItem(CHAT_KEY_PREFIX + table.id);
  }

  const remaining = getDialogueRemaining(table.id);

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
        {messages.length > 0 && (
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap gap-2 justify-end">
              {/* Free: raw chat export */}
              <button
                onClick={handleExportRawChat}
                className="rounded-lg bg-party-card border border-party-accent/20 px-3 py-1.5 text-xs text-party-text transition hover:bg-party-card/80"
              >
                Export Chat
              </button>
              {/* Pro features */}
              <button
                onClick={() => handleProFeature(handleDownloadTranscript)}
                disabled={downloading}
                className="rounded-lg bg-party-accent/10 border border-party-accent/20 px-3 py-1.5 text-xs text-party-accent transition hover:bg-party-accent/20 disabled:opacity-40"
              >
                {downloading ? "..." : "AI Transcript"}
                {!canUseProFeature() && <span className="ml-1 text-party-gold">PRO</span>}
              </button>
              <button
                onClick={() => handleProFeature(handleDownloadBilingual)}
                disabled={downloadingBilingual}
                className="rounded-lg bg-party-gold/10 border border-party-gold/20 px-3 py-1.5 text-xs text-party-gold transition hover:bg-party-gold/20 disabled:opacity-40"
              >
                {downloadingBilingual ? "..." : "Bilingual"}
                {!canUseProFeature() && <span className="ml-1">PRO</span>}
              </button>
              <button
                onClick={() => handleProFeature(handleGeneratePodcast)}
                disabled={generatingPodcast}
                className="rounded-lg bg-party-warm/10 border border-party-warm/20 px-3 py-1.5 text-xs text-party-warm transition hover:bg-party-warm/20 disabled:opacity-40"
              >
                {generatingPodcast ? "..." : "Podcast"}
                {!canUseProFeature() && <span className="ml-1 text-party-gold">PRO</span>}
              </button>
              <button
                onClick={handleClearChat}
                className="rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-1.5 text-xs text-red-400/60 transition hover:bg-red-500/10 hover:text-red-400"
                title="Clear chat history"
              >
                Clear
              </button>
            </div>
            {showUpgradeHint && (
              <p className="text-xs text-party-gold animate-pulse">
                Upgrade to Pro to use this feature
              </p>
            )}
            {remaining < Infinity && (
              <p className="text-[10px] text-party-muted">{remaining} dialogue rounds left</p>
            )}
          </div>
        )}
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
              <PaperTooltip key={i} reference={ref}>
                <div className="rounded-lg bg-party-bg/50 p-3 cursor-default">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-party-text">
                      {ref.authors_full || ref.authors}
                    </p>
                    {ref.is_top_tier && (
                      <span className="text-green-400 text-xs shrink-0" title={ref.journal || "Top-tier"}>✓</span>
                    )}
                  </div>
                  {ref.year && (
                    <p className="text-xs text-party-muted">({ref.year})</p>
                  )}
                  {ref.journal && (
                    <p className="text-xs text-green-400/70">{ref.journal}</p>
                  )}
                  {ref.citation_count != null && (
                    <p className="text-xs text-party-accent/50">{ref.citation_count} citations</p>
                  )}
                  <p className="mt-1 text-xs text-party-muted italic">
                    "{ref.key_argument}"
                  </p>
                </div>
              </PaperTooltip>
            ))}
          </div>

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

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

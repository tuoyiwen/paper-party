import { useState, useRef } from "react";
import type { PartyAnalysis } from "../types";
import { uploadPaper } from "../api";

interface HistoryEntry {
  id: string;
  paper_title: string;
  broad_question: string;
  tables_count: number;
  created_at: string;
  party: PartyAnalysis;
}

interface Props {
  onAnalyzed: (party: PartyAnalysis) => void;
  history?: HistoryEntry[];
  onOpenHistory?: (entry: HistoryEntry) => void;
}

export default function PaperUpload({ onAnalyzed, history, onOpenHistory }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress("Parsing your paper...");

    try {
      setProgress("Discovering the conversations in your paper...");
      const party = await uploadPaper(file);
      setProgress("Welcome to the party!");
      onAnalyzed(party);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      {/* Title */}
      <div className="mb-12 text-center">
        <h1 className="mb-3 text-5xl font-bold tracking-tight">
          <span className="text-party-accent">Paper</span>{" "}
          <span className="text-party-gold">Party</span>
        </h1>
        <p className="text-lg text-party-muted">
          Upload a paper. Discover the conversations. Join the table.
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex w-full max-w-lg cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed p-12 transition-all ${
          dragging
            ? "border-party-accent bg-party-accent/10 scale-105"
            : "border-party-muted/30 bg-party-card/50 hover:border-party-accent/50 hover:bg-party-card"
        } ${loading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {loading ? (
          <>
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-party-accent/30 border-t-party-accent" />
            <p className="text-party-accent">{progress}</p>
          </>
        ) : (
          <>
            <svg
              className="mb-4 h-12 w-12 text-party-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 16v-8m0 0l-3 3m3-3l3 3M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v3"
              />
            </svg>
            <p className="mb-1 text-lg font-medium">Drop your paper here</p>
            <p className="text-sm text-party-muted">or click to browse (PDF)</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-red-400">
          {error}
        </div>
      )}

      {/* How it works */}
      <div className="mt-16 grid max-w-3xl grid-cols-3 gap-8 text-center">
        {[
          {
            icon: "📄",
            title: "Upload",
            desc: "Drop a research paper (PDF)",
          },
          {
            icon: "🔍",
            title: "Discover",
            desc: "AI maps the literature landscape",
          },
          {
            icon: "💬",
            title: "Dialogue",
            desc: "Join tables and debate with the literature",
          },
        ].map((step) => (
          <div key={step.title} className="rounded-xl bg-party-card/30 p-6">
            <div className="mb-2 text-3xl">{step.icon}</div>
            <h3 className="mb-1 font-semibold text-party-accent">
              {step.title}
            </h3>
            <p className="text-sm text-party-muted">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Recent History */}
      {history && history.length > 0 && onOpenHistory && (
        <div className="mt-12 w-full max-w-2xl">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-party-muted">
            Recent Parties
          </h3>
          <div className="space-y-2">
            {history.slice(0, 5).map((entry) => (
              <button
                key={entry.id}
                onClick={() => onOpenHistory(entry)}
                className="w-full rounded-xl border border-party-accent/10 bg-party-card/40 p-4 text-left transition-all hover:border-party-accent/30 hover:bg-party-card"
              >
                <p className="text-sm font-medium text-party-text">
                  {entry.paper_title}
                </p>
                <p className="mt-1 text-xs text-party-muted">
                  {entry.tables_count} tables &middot;{" "}
                  {new Date(entry.created_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

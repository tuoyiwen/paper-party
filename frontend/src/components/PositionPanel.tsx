import { useState } from "react";
import type { PartyAnalysis, PositionAnalysis } from "../types";
import { analyzePosition, generatePositionLR } from "../api";
import { canUseProFeature } from "../plan";

interface Props {
  party: PartyAnalysis;
  onBack: () => void;
  onPositionAnalyzed?: (result: PositionAnalysis) => void;
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  aligned: "bg-green-500/15 text-green-400 border-green-500/30",
  "partially aligned": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "in tension": "bg-red-500/15 text-red-400 border-red-500/30",
  novel: "bg-party-gold/15 text-party-gold border-party-gold/30",
};

const CHAT_KEY_PREFIX = "paper-party-chat-";

function collectDiscussions(party: PartyAnalysis): string {
  const parts: string[] = [];
  for (const table of party.tables) {
    try {
      const raw = localStorage.getItem(CHAT_KEY_PREFIX + table.id);
      if (!raw) continue;
      const msgs = JSON.parse(raw) as Array<{ role: string; content: string }>;
      if (msgs.length === 0) continue;
      parts.push(`\n**Table: ${table.name}**`);
      for (const msg of msgs) {
        if (msg.role === "user") {
          parts.push(`User: ${msg.content}`);
        } else {
          parts.push(`${msg.role}: ${msg.content}`);
        }
      }
    } catch {
      // skip
    }
  }
  return parts.join("\n");
}

export default function PositionPanel({ party, onBack, onPositionAnalyzed }: Props) {
  const [viewpoint, setViewpoint] = useState("");
  const [analysis, setAnalysis] = useState<PositionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingLR, setGeneratingLR] = useState(false);

  async function handleAnalyze() {
    if (!viewpoint.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const result = await analyzePosition(viewpoint);
      setAnalysis(result);
      onPositionAnalyzed?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportPositionLR() {
    if (!viewpoint.trim()) return;
    if (!canUseProFeature()) {
      alert("Upgrade to Pro to export Literature Review");
      return;
    }
    setGeneratingLR(true);
    try {
      const discussions = collectDiscussions(party);
      const markdown = await generatePositionLR(viewpoint, discussions);
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "position_literature_review.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to generate literature review.");
    } finally {
      setGeneratingLR(false);
    }
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm text-party-muted hover:text-party-accent transition"
      >
        ← Back to party
      </button>

      <h2 className="mb-2 text-2xl font-bold">Find Your Position</h2>
      <p className="mb-6 text-party-muted">
        Enter your research question, and we'll map where it sits in the
        literature landscape and generate a targeted literature review.
      </p>

      {/* Input */}
      <div className="mb-8">
        <textarea
          value={viewpoint}
          onChange={(e) => setViewpoint(e.target.value)}
          placeholder="Enter your research question or viewpoint... (e.g., 'How does AI-mediated communication affect team trust formation in remote work settings?')"
          className="w-full rounded-xl bg-party-card border border-party-accent/20 p-4 text-sm text-party-text placeholder-party-muted/40 outline-none focus:border-party-accent transition min-h-[120px] resize-y"
          disabled={loading}
        />
        <div className="mt-3 flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={!viewpoint.trim() || loading}
            className="rounded-xl bg-party-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-party-accent/80 disabled:opacity-30"
          >
            {loading ? "Analyzing..." : "Map My Position"}
          </button>
          {analysis && (
            <button
              onClick={handleExportPositionLR}
              disabled={generatingLR}
              className="rounded-xl bg-party-gold/10 border border-party-gold/20 px-6 py-3 text-sm font-medium text-party-gold transition hover:bg-party-gold/20 disabled:opacity-40"
            >
              {generatingLR ? "Writing LR..." : "Export Literature Review (APA)"}
              {!canUseProFeature() && <span className="ml-1">PRO</span>}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 px-4 py-2 text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-2xl bg-gradient-to-br from-party-card to-party-bg border border-party-accent/20 p-6">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-party-gold">
              Your Position in the Literature
            </p>
            <p className="text-party-text leading-relaxed">
              {analysis.position_summary}
            </p>
          </div>

          {/* Alignment with tables */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Relationship to Each Table
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {analysis.alignment.map((item, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${
                    RELATIONSHIP_COLORS[item.relationship] ||
                    "bg-party-card/50 text-party-text border-party-accent/10"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-semibold">{item.table_name}</h4>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                      {item.relationship}
                    </span>
                  </div>
                  <p className="text-sm opacity-80">{item.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gaps & Opportunities */}
          <div className="rounded-xl bg-party-card/50 border border-party-accent/10 p-6">
            <h3 className="mb-3 text-lg font-semibold text-party-warm">
              Gaps & Opportunities
            </h3>
            <ul className="space-y-2">
              {analysis.gaps_and_opportunities.map((gap, i) => (
                <li key={i} className="flex gap-2 text-sm text-party-muted">
                  <span className="text-party-warm">→</span>
                  {gap}
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested Readings */}
          <div className="rounded-xl bg-party-card/50 border border-party-accent/10 p-6">
            <h3 className="mb-3 text-lg font-semibold text-party-accent">
              Suggested Next Readings
            </h3>
            <ul className="space-y-2">
              {analysis.suggested_next_readings.map((reading, i) => (
                <li key={i} className="flex gap-2 text-sm text-party-muted">
                  <span className="text-party-accent">📖</span>
                  {reading}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import type { PartyAnalysis, PositionAnalysis } from "../types";
import { generateLandscapeLR } from "../api";
import { canUseProFeature } from "../plan";

interface Props {
  party: PartyAnalysis;
  position: PositionAnalysis | null;
  onBack: () => void;
}

const STANCE_COLORS: Record<string, string> = {
  supports: "border-green-500 bg-green-500/10 text-green-400",
  challenges: "border-red-500 bg-red-500/10 text-red-400",
  extends: "border-blue-500 bg-blue-500/10 text-blue-400",
  "proposes alternative": "border-party-gold bg-party-gold/10 text-party-gold",
};

const STANCE_ICONS: Record<string, string> = {
  supports: "●",
  challenges: "▲",
  extends: "◆",
  "proposes alternative": "★",
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  aligned: "border-green-500/50 bg-green-500/5",
  "partially aligned": "border-blue-500/50 bg-blue-500/5",
  "in tension": "border-red-500/50 bg-red-500/5",
  novel: "border-party-gold/50 bg-party-gold/5",
};

export default function MindMap({ party, position, onBack }: Props) {
  const [generatingLR, setGeneratingLR] = useState(false);

  async function handleExportLR() {
    if (!canUseProFeature()) {
      alert("Upgrade to Pro to export Literature Review");
      return;
    }
    setGeneratingLR(true);
    try {
      const markdown = await generateLandscapeLR();
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "landscape_literature_review.md";
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
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={onBack}
            className="mb-2 text-sm text-party-muted hover:text-party-accent transition"
          >
            ← Back to party
          </button>
          <h2 className="text-2xl font-bold mb-2">Literature Mind Map</h2>
          <p className="text-sm text-party-muted">
            Visual overview of the research landscape
          </p>
        </div>
        <button
          onClick={handleExportLR}
          disabled={generatingLR}
          className="rounded-lg bg-party-accent/10 border border-party-accent/20 px-4 py-2 text-sm text-party-accent transition hover:bg-party-accent/20 disabled:opacity-40"
        >
          {generatingLR ? "Generating..." : "Export Literature Review (APA)"}
          {!canUseProFeature() && <span className="ml-1 text-party-gold">PRO</span>}
        </button>
      </div>

      {/* Center: Party Theme */}
      <div className="flex justify-center mb-8">
        <div className="max-w-lg rounded-2xl bg-gradient-to-br from-party-accent to-purple-700 px-8 py-5 text-center shadow-lg shadow-party-accent/20">
          <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Party Theme</p>
          <p className="text-lg font-bold text-white leading-snug">
            {party.broad_question.question}
          </p>
        </div>
      </div>

      {/* Connector line */}
      <div className="flex justify-center mb-8">
        <div className="w-0.5 h-8 bg-party-accent/30" />
      </div>

      {/* Your Paper */}
      <div className="flex justify-center mb-8">
        <div className="max-w-md rounded-xl bg-party-warm/10 border border-party-warm/30 px-6 py-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-party-warm/60 mb-1">Your Paper</p>
          <p className="text-sm font-semibold text-party-text">{party.paper_title}</p>
          <p className="text-xs text-party-muted mt-1 line-clamp-2">{party.paper_contribution}</p>
        </div>
      </div>

      {/* Connector lines */}
      <div className="flex justify-center mb-4">
        <div className="w-0.5 h-6 bg-party-accent/20" />
      </div>
      <div className="flex justify-center mb-8">
        <div className="h-0.5 bg-party-accent/20" style={{ width: "80%" }} />
      </div>

      {/* Tables Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {party.tables.map((table) => (
          <div
            key={table.id}
            className="rounded-xl border border-party-accent/20 bg-party-card p-5"
          >
            {/* Table header */}
            <h3 className="text-base font-semibold text-party-accent mb-1">{table.name}</h3>
            <p className="text-xs text-party-muted mb-3">{table.topic}</p>

            {/* Consensus / Differences mini */}
            {table.consensus && (
              <div className="rounded bg-green-500/5 border border-green-500/10 px-2 py-1 mb-2">
                <p className="text-[9px] uppercase text-green-400/60">Consensus</p>
                <p className="text-[10px] text-party-muted line-clamp-2">{table.consensus}</p>
              </div>
            )}
            {table.differences && (
              <div className="rounded bg-red-500/5 border border-red-500/10 px-2 py-1 mb-3">
                <p className="text-[9px] uppercase text-red-400/60">Differences</p>
                <p className="text-[10px] text-party-muted line-clamp-2">{table.differences}</p>
              </div>
            )}

            {/* Papers */}
            <div className="space-y-2">
              {table.references.map((ref, ri) => {
                const stance = ref.stance || "";
                return (
                  <div
                    key={ri}
                    className={`rounded-lg border px-3 py-2 ${STANCE_COLORS[stance] || "border-party-accent/20 bg-party-card/50 text-party-muted"}`}
                  >
                    <div className="flex items-start gap-1.5">
                      <span className="text-xs shrink-0 mt-0.5">
                        {STANCE_ICONS[stance] || "●"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-party-text truncate">
                          {ref.authors_full || ref.authors}
                          {ref.year && ` (${ref.year})`}
                        </p>
                        {ref.journal && (
                          <p className="text-[9px] text-green-400/60 truncate">{ref.journal}</p>
                        )}
                        {ref.citation_count != null && ref.citation_count > 0 && (
                          <p className="text-[9px] text-party-accent/40">{ref.citation_count} citations</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {table.references.length === 0 && (
                <p className="text-xs text-party-muted/40 italic">No papers found</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Position Analysis (if available) */}
      {position && (
        <>
          <div className="flex justify-center mb-4">
            <div className="w-0.5 h-6 bg-party-warm/30" />
          </div>

          <div className="rounded-2xl border-2 border-party-warm/30 bg-party-warm/5 p-6 mb-6">
            <p className="text-[10px] uppercase tracking-widest text-party-warm/60 mb-2">My Position</p>
            <p className="text-sm text-party-text leading-relaxed mb-4">
              {position.position_summary}
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              {position.alignment.map((a, i) => (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-2 ${RELATIONSHIP_COLORS[a.relationship] || "border-party-accent/20"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-party-text">{a.table_name}</p>
                    <span className="text-[9px] rounded-full bg-white/5 px-2 py-0.5">{a.relationship}</span>
                  </div>
                  <p className="text-[10px] text-party-muted">{a.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-party-muted border-t border-party-accent/10 pt-4">
        <span className="flex items-center gap-1"><span className="text-green-400">●</span> Supports</span>
        <span className="flex items-center gap-1"><span className="text-red-400">▲</span> Challenges</span>
        <span className="flex items-center gap-1"><span className="text-blue-400">◆</span> Extends</span>
        <span className="flex items-center gap-1"><span className="text-party-gold">★</span> Alternative</span>
      </div>
    </div>
  );
}

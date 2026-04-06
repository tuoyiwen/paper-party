import type { PartyAnalysis, Table } from "../types";
import PaperTooltip from "./PaperTooltip";

interface Props {
  party: PartyAnalysis;
  onJoinTable: (table: Table) => void;
}

const STANCE_COLORS: Record<string, string> = {
  supports: "text-green-400",
  challenges: "text-red-400",
  extends: "text-blue-400",
  "proposes alternative": "text-party-gold",
};

export default function PartyView({ party, onJoinTable }: Props) {
  return (
    <div>
      {/* Party Header */}
      <div className="mb-10 rounded-2xl bg-gradient-to-br from-party-card to-party-bg border border-party-accent/20 p-8">
        <p className="mb-1 text-sm font-medium uppercase tracking-wider text-party-gold">
          The Party Theme
        </p>
        <h2 className="mb-3 text-2xl font-bold">
          {party.broad_question.question}
        </h2>
        <p className="mb-4 text-party-muted">
          {party.broad_question.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {party.broad_question.keywords.map((kw) => (
            <span
              key={kw}
              className="rounded-full bg-party-accent/15 px-3 py-1 text-xs text-party-accent"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Paper's Contribution */}
      <div className="mb-8 rounded-xl bg-party-card/50 border border-party-accent/10 p-6">
        <p className="mb-1 text-sm font-medium text-party-warm">
          Your Paper's Contribution
        </p>
        <h3 className="mb-2 text-lg font-semibold">{party.paper_title}</h3>
        <p className="text-party-muted">{party.paper_contribution}</p>
      </div>

      {/* Tables */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Discussion Tables ({party.tables.length})
        </h3>
        <p className="text-sm text-party-muted">
          Click a table to join the conversation
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {party.tables.map((table) => (
          <button
            key={table.id}
            onClick={() => onJoinTable(table)}
            className="group rounded-2xl border border-party-accent/10 bg-party-card/60 p-6 text-left transition-all hover:border-party-accent/40 hover:bg-party-card hover:shadow-lg hover:shadow-party-accent/10"
          >
            <div className="mb-3 flex items-start justify-between">
              <h4 className="text-lg font-semibold text-party-accent group-hover:text-white transition">
                {table.name}
              </h4>
              <span className="mt-1 rounded-full bg-party-accent/10 px-2 py-0.5 text-xs text-party-muted">
                {table.references.length} papers
              </span>
            </div>

            <p className="mb-3 text-sm text-party-text">{table.topic}</p>

            <div className="mb-3 rounded-lg bg-party-bg/50 p-3">
              <p className="text-xs font-medium text-party-gold mb-1">
                Key Debate
              </p>
              <p className="text-sm text-party-muted">{table.key_debate}</p>
            </div>

            {/* Consensus & Differences */}
            {table.consensus && (
              <div className="mb-3 rounded-lg bg-green-500/5 border border-green-500/10 p-3">
                <p className="text-xs font-medium text-green-400 mb-1">
                  Consensus
                </p>
                <p className="text-xs text-party-muted line-clamp-2">{table.consensus}</p>
              </div>
            )}
            {table.differences && (
              <div className="mb-3 rounded-lg bg-red-500/5 border border-red-500/10 p-3">
                <p className="text-xs font-medium text-red-400 mb-1">
                  Differences
                </p>
                <p className="text-xs text-party-muted line-clamp-2">{table.differences}</p>
              </div>
            )}

            {/* Reference previews */}
            <div className="space-y-2">
              {table.references.slice(0, 3).map((ref, i) => (
                <PaperTooltip key={i} reference={ref}>
                  <div className="flex items-start gap-2 text-xs cursor-default">
                    <span
                      className={`mt-0.5 shrink-0 ${
                        STANCE_COLORS[ref.stance] || "text-party-muted"
                      }`}
                    >
                      {ref.stance === "supports"
                        ? "●"
                        : ref.stance === "challenges"
                          ? "▲"
                          : ref.stance === "extends"
                            ? "◆"
                            : "★"}
                    </span>
                    <span className="text-party-muted">
                      <span className="text-party-text">{ref.authors_full || ref.authors}</span>{" "}
                      {ref.year && `(${ref.year})`}
                      {ref.citation_count != null && (
                        <span className="ml-1 text-party-accent/60" title="Citations">
                          [{ref.citation_count} cited]
                        </span>
                      )}
                      {ref.is_top_tier && (
                        <span className="ml-1 text-green-400" title={ref.journal || "Top-tier journal"}>
                          ✓
                        </span>
                      )}
                    </span>
                  </div>
                </PaperTooltip>
              ))}
            </div>

            <div className="mt-4 text-xs text-party-accent opacity-0 group-hover:opacity-100 transition">
              Join this table →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

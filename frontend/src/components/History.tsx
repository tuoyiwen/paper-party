interface HistoryEntry {
  id: string;
  paper_title: string;
  broad_question: string;
  tables_count: number;
  created_at: string;
  party: import("../types").PartyAnalysis;
}

interface Props {
  entries: HistoryEntry[];
  onOpen: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onNewPaper: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function History({ entries, onOpen, onDelete, onNewPaper }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <p className="mb-4 text-lg text-party-muted">No history yet</p>
        <button
          onClick={onNewPaper}
          className="rounded-xl bg-party-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-party-accent/80"
        >
          Upload your first paper
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Browsing History</h2>
          <p className="text-sm text-party-muted">
            Re-enter a previous party or start a new one
          </p>
        </div>
        <button
          onClick={onNewPaper}
          className="rounded-xl bg-party-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-party-accent/80"
        >
          New Paper
        </button>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="group flex items-center justify-between rounded-xl border border-party-accent/10 bg-party-card/50 p-5 transition-all hover:border-party-accent/30 hover:bg-party-card"
          >
            <button
              onClick={() => onOpen(entry)}
              className="flex-1 text-left"
            >
              <h3 className="mb-1 text-lg font-semibold text-party-text group-hover:text-white transition">
                {entry.paper_title}
              </h3>
              <p className="mb-2 text-sm text-party-muted line-clamp-1">
                {entry.broad_question}
              </p>
              <div className="flex gap-4 text-xs text-party-muted">
                <span>{entry.tables_count} tables</span>
                <span>{formatDate(entry.created_at)}</span>
              </div>
            </button>

            <div className="ml-4 flex shrink-0 gap-2">
              <button
                onClick={() => onOpen(entry)}
                className="rounded-lg bg-party-accent/10 px-4 py-2 text-sm text-party-accent transition hover:bg-party-accent/20"
              >
                Re-enter
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.id);
                }}
                className="rounded-lg px-3 py-2 text-sm text-party-muted transition hover:bg-red-500/10 hover:text-red-400"
                title="Delete"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

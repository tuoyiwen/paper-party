import { useState, useEffect } from "react";
import type { PartyAnalysis, Table, PositionAnalysis } from "./types";
import PaperUpload from "./components/PaperUpload";
import PartyView from "./components/PartyView";
import TableDialogue from "./components/TableDialogue";
import PositionPanel from "./components/PositionPanel";
import History from "./components/History";
import MindMap from "./components/MindMap";
import { recordUpload } from "./plan";

type View = "upload" | "party" | "table" | "position" | "history" | "mindmap";

interface HistoryEntry {
  id: string;
  paper_title: string;
  broad_question: string;
  tables_count: number;
  created_at: string;
  party: PartyAnalysis;
}

const HISTORY_KEY = "paper-party-history";

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

function addToHistory(party: PartyAnalysis): HistoryEntry[] {
  const entries = loadHistory();
  const entry: HistoryEntry = {
    id: `party-${Date.now()}`,
    paper_title: party.paper_title,
    broad_question: party.broad_question.question,
    tables_count: party.tables.length,
    created_at: new Date().toISOString(),
    party,
  };
  // Prepend, keep max 20
  const updated = [entry, ...entries].slice(0, 20);
  saveHistory(updated);
  return updated;
}

export default function App() {
  const [view, setView] = useState<View>("upload");
  const [party, setParty] = useState<PartyAnalysis | null>(null);
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const [positionResult, setPositionResult] = useState<PositionAnalysis | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function handlePartyReady(p: PartyAnalysis) {
    setParty(p);
    setView("party");
    recordUpload();
    const updated = addToHistory(p);
    setHistory(updated);
  }

  function handleJoinTable(table: Table) {
    setActiveTable(table);
    setView("table");
  }

  function handleBackToParty() {
    setActiveTable(null);
    setView("party");
  }

  function handleOpenHistory(entry: HistoryEntry) {
    setParty(entry.party);
    setView("party");
  }

  function handleDeleteHistory(id: string) {
    const updated = history.filter((h) => h.id !== id);
    saveHistory(updated);
    setHistory(updated);
  }

  const hasHistory = history.length > 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-party-card px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button
            onClick={() => party ? setView("party") : setView("upload")}
            className="text-xl font-bold text-party-accent hover:text-white transition"
          >
            Paper Party
          </button>
          <div className="flex gap-3">
            {hasHistory && (view === "upload" || view === "history") && (
              <button
                onClick={() => setView(view === "history" ? "upload" : "history")}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  view === "history"
                    ? "bg-party-accent text-white"
                    : "text-party-muted hover:text-white"
                }`}
              >
                {view === "history" ? "New Paper" : "History"}
              </button>
            )}
            {party && view !== "upload" && view !== "history" && (
              <>
                <button
                  onClick={() => setView("party")}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    view === "party"
                      ? "bg-party-accent text-white"
                      : "text-party-muted hover:text-white"
                  }`}
                >
                  Party Overview
                </button>
                <button
                  onClick={() => setView("mindmap")}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    view === "mindmap"
                      ? "bg-party-accent text-white"
                      : "text-party-muted hover:text-white"
                  }`}
                >
                  Mind Map
                </button>
                <button
                  onClick={() => setView("position")}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    view === "position"
                      ? "bg-party-accent text-white"
                      : "text-party-muted hover:text-white"
                  }`}
                >
                  My Position
                </button>
                <button
                  onClick={() => setView("history")}
                  className="rounded-lg px-3 py-1.5 text-sm text-party-muted hover:text-white transition"
                >
                  History
                </button>
                <button
                  onClick={() => {
                    setParty(null);
                    setActiveTable(null);
                    setView("upload");
                  }}
                  className="rounded-lg px-3 py-1.5 text-sm text-party-muted hover:text-party-warm transition"
                >
                  New Paper
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {view === "upload" && (
          <PaperUpload onAnalyzed={handlePartyReady} history={history} onOpenHistory={handleOpenHistory} />
        )}
        {view === "history" && (
          <History
            entries={history}
            onOpen={handleOpenHistory}
            onDelete={handleDeleteHistory}
            onNewPaper={() => setView("upload")}
          />
        )}
        {view === "party" && party && (
          <PartyView party={party} onJoinTable={handleJoinTable} />
        )}
        {view === "table" && party && activeTable && (
          <TableDialogue
            table={activeTable}
            onBack={handleBackToParty}
          />
        )}
        {view === "mindmap" && party && (
          <MindMap party={party} position={positionResult} onBack={handleBackToParty} />
        )}
        {view === "position" && party && (
          <PositionPanel party={party} onBack={handleBackToParty} onPositionAnalyzed={setPositionResult} />
        )}
      </main>
    </div>
  );
}

import { useState } from "react";
import type { PartyAnalysis, Table } from "./types";
import PaperUpload from "./components/PaperUpload";
import PartyView from "./components/PartyView";
import TableDialogue from "./components/TableDialogue";
import PositionPanel from "./components/PositionPanel";

type View = "upload" | "party" | "table" | "position";

export default function App() {
  const [view, setView] = useState<View>("upload");
  const [party, setParty] = useState<PartyAnalysis | null>(null);
  const [activeTable, setActiveTable] = useState<Table | null>(null);

  function handlePartyReady(p: PartyAnalysis) {
    setParty(p);
    setView("party");
  }

  function handleJoinTable(table: Table) {
    setActiveTable(table);
    setView("table");
  }

  function handleBackToParty() {
    setActiveTable(null);
    setView("party");
  }

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
            {party && view !== "upload" && (
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
        {view === "upload" && <PaperUpload onAnalyzed={handlePartyReady} />}
        {view === "party" && party && (
          <PartyView party={party} onJoinTable={handleJoinTable} />
        )}
        {view === "table" && party && activeTable && (
          <TableDialogue
            table={activeTable}
            onBack={handleBackToParty}
          />
        )}
        {view === "position" && party && (
          <PositionPanel party={party} onBack={handleBackToParty} />
        )}
      </main>
    </div>
  );
}

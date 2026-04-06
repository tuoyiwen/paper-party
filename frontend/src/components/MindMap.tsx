import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { PartyAnalysis, PositionAnalysis } from "../types";

interface Props {
  party: PartyAnalysis;
  position: PositionAnalysis | null;
  onBack: () => void;
}

// Custom node components
function CenterNode({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-party-accent to-purple-700 px-6 py-4 text-center shadow-lg shadow-party-accent/30 max-w-[300px]">
      <p className="text-[10px] uppercase tracking-wider text-white/60 mb-1">Party Theme</p>
      <p className="text-sm font-bold text-white leading-snug">{data.label as string}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-party-accent !w-2 !h-2" />
    </div>
  );
}

function TableNode({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="rounded-xl bg-party-card border border-party-accent/30 px-5 py-3 max-w-[250px] shadow-md">
      <Handle type="target" position={Position.Top} className="!bg-party-accent !w-2 !h-2" />
      <p className="text-xs font-semibold text-party-accent mb-1">{data.label as string}</p>
      <p className="text-[10px] text-party-muted leading-snug mb-2">{data.topic as string}</p>
      {data.consensus && (
        <div className="rounded bg-green-500/10 px-2 py-1 mb-1">
          <p className="text-[9px] text-green-400 leading-snug line-clamp-2">{data.consensus as string}</p>
        </div>
      )}
      {data.differences && (
        <div className="rounded bg-red-500/10 px-2 py-1">
          <p className="text-[9px] text-red-400 leading-snug line-clamp-2">{data.differences as string}</p>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-party-accent !w-2 !h-2" />
    </div>
  );
}

function PaperNode({ data }: { data: Record<string, unknown> }) {
  const stanceColors: Record<string, string> = {
    supports: "border-green-500/50 bg-green-500/5",
    challenges: "border-red-500/50 bg-red-500/5",
    extends: "border-blue-500/50 bg-blue-500/5",
    "proposes alternative": "border-party-gold/50 bg-party-gold/5",
  };
  const stanceIcons: Record<string, string> = {
    supports: "●",
    challenges: "▲",
    extends: "◆",
    "proposes alternative": "★",
  };
  const stanceTextColors: Record<string, string> = {
    supports: "text-green-400",
    challenges: "text-red-400",
    extends: "text-blue-400",
    "proposes alternative": "text-party-gold",
  };
  const stance = data.stance as string;

  return (
    <div className={`rounded-lg border px-3 py-2 max-w-[200px] ${stanceColors[stance] || "border-party-accent/20 bg-party-card/50"}`}>
      <Handle type="target" position={Position.Top} className="!bg-party-muted !w-1.5 !h-1.5" />
      <div className="flex items-start gap-1.5">
        <span className={`text-xs shrink-0 ${stanceTextColors[stance] || "text-party-muted"}`}>
          {stanceIcons[stance] || "●"}
        </span>
        <div>
          <p className="text-[10px] font-medium text-party-text leading-snug">
            {data.authors as string}
          </p>
          <p className="text-[9px] text-party-muted">{data.year as string}</p>
          {data.journal && (
            <p className="text-[8px] text-green-400/70 mt-0.5">{data.journal as string}</p>
          )}
          {data.citations != null && (
            <p className="text-[8px] text-party-accent/50">{data.citations as number} cited</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PositionNode({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="rounded-xl bg-party-warm/20 border-2 border-party-warm px-4 py-3 max-w-[220px] shadow-md shadow-party-warm/20">
      <Handle type="target" position={Position.Top} className="!bg-party-warm !w-2 !h-2" />
      <p className="text-[10px] uppercase tracking-wider text-party-warm/80 mb-1">My Position</p>
      <p className="text-[10px] text-party-text leading-snug line-clamp-4">{data.label as string}</p>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  center: CenterNode,
  tableNode: TableNode,
  paper: PaperNode,
  position: PositionNode,
};

function buildGraph(party: PartyAnalysis, position: PositionAnalysis | null) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Center node
  nodes.push({
    id: "center",
    type: "center",
    position: { x: 400, y: 0 },
    data: { label: party.broad_question.question },
  });

  // Paper contribution node
  nodes.push({
    id: "my-paper",
    type: "position",
    position: { x: 750, y: 0 },
    data: { label: party.paper_contribution },
  });
  edges.push({
    id: "center-my-paper",
    source: "center",
    target: "my-paper",
    style: { stroke: "#f97316", strokeDasharray: "5,5" },
  });

  // Table nodes spread horizontally
  const tableSpacing = 320;
  const totalWidth = (party.tables.length - 1) * tableSpacing;
  const startX = 400 - totalWidth / 2;

  party.tables.forEach((table, ti) => {
    const tableId = `table-${ti}`;
    const tableX = startX + ti * tableSpacing;
    const tableY = 180;

    nodes.push({
      id: tableId,
      type: "tableNode",
      position: { x: tableX, y: tableY },
      data: {
        label: table.name,
        topic: table.topic,
        consensus: table.consensus,
        differences: table.differences,
      },
    });

    edges.push({
      id: `center-${tableId}`,
      source: "center",
      target: tableId,
      style: { stroke: "#a78bfa", strokeWidth: 2 },
      animated: true,
    });

    // Paper nodes for each table
    const paperSpacing = 170;
    const totalPaperWidth = (table.references.length - 1) * paperSpacing;
    const paperStartX = tableX - totalPaperWidth / 2 + 25;

    table.references.forEach((ref, ri) => {
      const paperId = `paper-${ti}-${ri}`;
      nodes.push({
        id: paperId,
        type: "paper",
        position: { x: paperStartX + ri * paperSpacing, y: tableY + 170 },
        data: {
          authors: ref.authors_full || ref.authors,
          year: ref.year || "n.d.",
          stance: ref.stance,
          journal: ref.journal,
          citations: ref.citation_count,
        },
      });

      edges.push({
        id: `${tableId}-${paperId}`,
        source: tableId,
        target: paperId,
        style: {
          stroke:
            ref.stance === "supports" ? "#4ade80" :
            ref.stance === "challenges" ? "#f87171" :
            ref.stance === "extends" ? "#60a5fa" :
            "#fbbf24",
        },
      });
    });
  });

  // Position node (if available)
  if (position) {
    const posId = "user-position";
    nodes.push({
      id: posId,
      type: "position",
      position: { x: 400, y: 500 },
      data: { label: position.position_summary.slice(0, 200) },
    });

    // Connect to relevant tables
    position.alignment.forEach((a, i) => {
      const tableIndex = party.tables.findIndex((t) => t.name === a.table_name);
      if (tableIndex >= 0) {
        edges.push({
          id: `pos-table-${i}`,
          source: `table-${tableIndex}`,
          target: posId,
          style: {
            stroke:
              a.relationship === "aligned" ? "#4ade80" :
              a.relationship === "in tension" ? "#f87171" :
              a.relationship === "novel" ? "#fbbf24" :
              "#60a5fa",
            strokeDasharray: "5,5",
          },
          label: a.relationship,
          labelStyle: { fontSize: 9, fill: "#8b85a0" },
        });
      }
    });
  }

  return { nodes, edges };
}

export default function MindMap({ party, position, onBack }: Props) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph(party, position),
    [party, position]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onExportImage = useCallback(() => {
    const el = document.querySelector(".react-flow") as HTMLElement;
    if (!el) return;
    // Simple: copy to clipboard notification
    alert("Tip: Use your browser's screenshot tool (Ctrl+Shift+S on Windows) to capture the mind map.");
  }, []);

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="mb-2 text-sm text-party-muted hover:text-party-accent transition"
          >
            ← Back to party
          </button>
          <h2 className="text-xl font-bold">Literature Mind Map</h2>
          <p className="text-sm text-party-muted">Drag nodes to rearrange. Scroll to zoom.</p>
        </div>
        <button
          onClick={onExportImage}
          className="rounded-lg bg-party-accent/10 border border-party-accent/20 px-4 py-2 text-sm text-party-accent transition hover:bg-party-accent/20"
        >
          Export Image
        </button>
      </div>

      <div className="flex-1 rounded-xl border border-party-accent/10 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.3}
          maxZoom={2}
          defaultEdgeOptions={{ type: "smoothstep" }}
        >
          <Background color="#a78bfa" gap={20} size={1} style={{ opacity: 0.05 }} />
          <Controls
            style={{ background: "#1a1230", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 8 }}
          />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === "center") return "#a78bfa";
              if (n.type === "tableNode") return "#1a1230";
              if (n.type === "position") return "#f97316";
              return "#2a2040";
            }}
            style={{ background: "#0f0a1a", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 8 }}
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-party-muted">
        <span className="flex items-center gap-1"><span className="text-green-400">●</span> Supports</span>
        <span className="flex items-center gap-1"><span className="text-red-400">▲</span> Challenges</span>
        <span className="flex items-center gap-1"><span className="text-blue-400">◆</span> Extends</span>
        <span className="flex items-center gap-1"><span className="text-party-gold">★</span> Alternative</span>
        <span className="flex items-center gap-1"><span className="text-party-warm">■</span> My Position</span>
      </div>
    </div>
  );
}

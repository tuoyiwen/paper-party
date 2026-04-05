import type {
  PartyAnalysis,
  DialogueMessage,
  DialogueResponse,
  PositionAnalysis,
} from "./types";

const BASE = "/api";

export async function uploadPaper(file: File): Promise<PartyAnalysis> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE}/papers/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }

  return res.json();
}

export async function dialogueAtTable(
  tableId: string,
  userMessage: string,
  history: DialogueMessage[]
): Promise<DialogueResponse> {
  const res = await fetch(`${BASE}/tables/${tableId}/dialogue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table_id: tableId,
      user_message: userMessage,
      history,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Dialogue failed" }));
    throw new Error(err.detail || "Dialogue failed");
  }

  return res.json();
}

export async function analyzePosition(
  userViewpoint: string
): Promise<PositionAnalysis> {
  const res = await fetch(`${BASE}/position`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_viewpoint: userViewpoint }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Analysis failed" }));
    throw new Error(err.detail || "Analysis failed");
  }

  return res.json();
}

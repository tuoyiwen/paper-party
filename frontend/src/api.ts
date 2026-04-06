import type {
  PartyAnalysis,
  DialogueMessage,
  DialogueResponse,
  PositionAnalysis,
} from "./types";

const BASE = import.meta.env.PROD
  ? "https://paper-party-production.up.railway.app/api"
  : "/api";

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

export async function generateTranscript(
  tableName: string,
  tableTopic: string,
  messages: DialogueMessage[]
): Promise<string> {
  const res = await fetch(`${BASE}/transcript`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table_name: tableName,
      table_topic: tableTopic,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Transcript failed" }));
    throw new Error(err.detail || "Transcript generation failed");
  }

  const data = await res.json();
  return data.markdown;
}

export async function generateBilingualSummary(
  tableName: string,
  tableTopic: string,
  messages: DialogueMessage[]
): Promise<string> {
  const res = await fetch(`${BASE}/bilingual-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table_name: tableName,
      table_topic: tableTopic,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Summary failed" }));
    throw new Error(err.detail || "Bilingual summary generation failed");
  }

  const data = await res.json();
  return data.markdown;
}

export async function generatePodcast(
  tableName: string,
  tableTopic: string,
  messages: DialogueMessage[]
): Promise<Blob> {
  const res = await fetch(`${BASE}/podcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table_name: tableName,
      table_topic: tableTopic,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Podcast failed" }));
    throw new Error(err.detail || "Podcast generation failed");
  }

  return res.blob();
}

export async function generateLandscapeLR(): Promise<string> {
  const res = await fetch(`${BASE}/literature-review/landscape`, {
    method: "POST",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "LR generation failed" }));
    throw new Error(err.detail || "Literature review generation failed");
  }

  const data = await res.json();
  return data.markdown;
}

export async function generatePositionLR(
  userQuestion: string,
  discussions: string
): Promise<string> {
  const res = await fetch(`${BASE}/literature-review/position`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_question: userQuestion,
      discussions,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "LR generation failed" }));
    throw new Error(err.detail || "Position literature review generation failed");
  }

  const data = await res.json();
  return data.markdown;
}

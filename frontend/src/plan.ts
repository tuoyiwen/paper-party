/**
 * Plan management — TEMPORARILY DISABLED.
 *
 * All gating checks below now return true / Infinity so every user gets
 * unlimited access while we're still iterating on the product. The real
 * limits are preserved as constants at the top so we can flip this back on
 * later by reverting the guards.
 */

export type Plan = "free" | "paper_pack" | "pro";

const PLAN_KEY = "paper-party-plan";
const USAGE_KEY = "paper-party-usage";
const PACK_KEY = "paper-party-pack-credits";

// Limits (unused while gating is disabled — kept for when we re-enable)
const FREE_UPLOADS_PER_MONTH = 3;
const FREE_DIALOGUE_ROUNDS = 3;
const PACK_PAPERS = 5;

interface Usage {
  uploads_this_month: number;
  month: string; // "YYYY-MM"
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getPlan(): Plan {
  return (localStorage.getItem(PLAN_KEY) as Plan) || "pro";
}

export function setPlan(plan: Plan) {
  localStorage.setItem(PLAN_KEY, plan);
}

// Paper Pack credits
export function getPackCredits(): number {
  try {
    return parseInt(localStorage.getItem(PACK_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

export function addPackCredits(count: number = PACK_PAPERS) {
  const current = getPackCredits();
  localStorage.setItem(PACK_KEY, String(current + count));
}

function getUsage(): Usage {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    const usage = raw ? JSON.parse(raw) : null;
    if (!usage || usage.month !== currentMonth()) {
      return { uploads_this_month: 0, month: currentMonth() };
    }
    return usage;
  } catch {
    return { uploads_this_month: 0, month: currentMonth() };
  }
}

function saveUsage(usage: Usage) {
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
}

export function recordUpload() {
  // Still track usage counts for analytics, but don't block on them.
  const usage = getUsage();
  usage.uploads_this_month += 1;
  saveUsage(usage);
}

// ---- Gating (temporarily disabled — always allow) ----

export function canUpload(): boolean {
  return true;
}

export function getUploadsRemaining(): number {
  return Infinity;
}

export function canUseProFeature(): boolean {
  return true;
}

const DIALOGUE_KEY_PREFIX = "paper-party-dialogue-";

export function getDialogueRounds(tableId: string): number {
  try {
    return parseInt(localStorage.getItem(DIALOGUE_KEY_PREFIX + tableId) || "0", 10);
  } catch {
    return 0;
  }
}

export function recordDialogueRound(tableId: string) {
  const rounds = getDialogueRounds(tableId) + 1;
  localStorage.setItem(DIALOGUE_KEY_PREFIX + tableId, String(rounds));
}

export function canDialogue(_tableId: string): boolean {
  return true;
}

export function getDialogueRemaining(_tableId: string): number {
  return Infinity;
}

// Silence unused-constant warnings while gating is disabled.
void FREE_UPLOADS_PER_MONTH;
void FREE_DIALOGUE_ROUNDS;

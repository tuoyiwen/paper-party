/**
 * Simple plan management using localStorage.
 * In production, this would be backed by a real auth/billing system.
 */

export type Plan = "free" | "pro";

const PLAN_KEY = "paper-party-plan";
const USAGE_KEY = "paper-party-usage";

interface Usage {
  uploads_this_month: number;
  month: string; // "YYYY-MM"
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getPlan(): Plan {
  return (localStorage.getItem(PLAN_KEY) as Plan) || "free";
}

export function setPlan(plan: Plan) {
  localStorage.setItem(PLAN_KEY, plan);
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
  const usage = getUsage();
  usage.uploads_this_month += 1;
  saveUsage(usage);
}

export function canUpload(): boolean {
  if (getPlan() === "pro") return true;
  const usage = getUsage();
  return usage.uploads_this_month < 3;
}

export function getUploadsRemaining(): number {
  if (getPlan() === "pro") return Infinity;
  const usage = getUsage();
  return Math.max(0, 3 - usage.uploads_this_month);
}

export function canUseProFeature(): boolean {
  return getPlan() === "pro";
}

// Dialogue round limits
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

export function canDialogue(tableId: string): boolean {
  if (getPlan() === "pro") return true;
  return getDialogueRounds(tableId) < 5;
}

export function getDialogueRemaining(tableId: string): number {
  if (getPlan() === "pro") return Infinity;
  return Math.max(0, 5 - getDialogueRounds(tableId));
}

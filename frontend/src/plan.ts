/**
 * Plan management using localStorage.
 * In production, this would be backed by a real auth/billing system (e.g. Stripe + Supabase).
 */

export type Plan = "free" | "paper_pack" | "pro";

const PLAN_KEY = "paper-party-plan";
const USAGE_KEY = "paper-party-usage";
const PACK_KEY = "paper-party-pack-credits";

// Limits
const FREE_UPLOADS_PER_MONTH = 1;
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
  // Default to "pro" during testing; change to "free" for production
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

function usePackCredit() {
  const current = getPackCredits();
  if (current > 0) {
    localStorage.setItem(PACK_KEY, String(current - 1));
  }
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
  const plan = getPlan();
  if (plan === "paper_pack") {
    usePackCredit();
  }
  const usage = getUsage();
  usage.uploads_this_month += 1;
  saveUsage(usage);
}

export function canUpload(): boolean {
  const plan = getPlan();
  if (plan === "pro") return true;
  if (plan === "paper_pack") return getPackCredits() > 0;
  // Free
  const usage = getUsage();
  return usage.uploads_this_month < FREE_UPLOADS_PER_MONTH;
}

export function getUploadsRemaining(): number {
  const plan = getPlan();
  if (plan === "pro") return Infinity;
  if (plan === "paper_pack") return getPackCredits();
  const usage = getUsage();
  return Math.max(0, FREE_UPLOADS_PER_MONTH - usage.uploads_this_month);
}

export function canUseProFeature(): boolean {
  const plan = getPlan();
  return plan === "pro" || plan === "paper_pack";
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
  const plan = getPlan();
  if (plan === "pro" || plan === "paper_pack") return true;
  return getDialogueRounds(tableId) < FREE_DIALOGUE_ROUNDS;
}

export function getDialogueRemaining(tableId: string): number {
  const plan = getPlan();
  if (plan === "pro" || plan === "paper_pack") return Infinity;
  return Math.max(0, FREE_DIALOGUE_ROUNDS - getDialogueRounds(tableId));
}

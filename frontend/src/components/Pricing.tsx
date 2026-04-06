import type { Plan } from "../plan";

interface Props {
  currentPlan: Plan;
  onSelectPlan: (plan: Plan) => void;
  onBack: () => void;
}

const CHECK = "✓";
const CROSS = "—";

export default function Pricing({ currentPlan, onSelectPlan, onBack }: Props) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-sm text-party-muted hover:text-party-accent transition"
      >
        ← Back
      </button>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-party-muted">
          Unlock the full power of academic literature exploration
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
        {/* Free Plan */}
        <div className={`rounded-2xl border p-7 ${
          currentPlan === "free"
            ? "border-party-accent/40 bg-party-card"
            : "border-party-accent/10 bg-party-card/50"
        }`}>
          <div className="mb-6">
            <h3 className="text-xl font-bold">Free</h3>
            <p className="mt-1 text-3xl font-bold">
              $0
            </p>
            <p className="mt-2 text-sm text-party-muted">
              Try Paper Party
            </p>
          </div>

          {currentPlan === "free" ? (
            <div className="mb-6 rounded-lg bg-party-accent/10 px-3 py-1.5 text-center text-sm text-party-accent">
              Current Plan
            </div>
          ) : (
            <div className="mb-6 h-[38px]" />
          )}

          <ul className="space-y-3 text-sm">
            <PlanFeature included label="1 paper per month" />
            <PlanFeature included label="Party Overview" />
            <PlanFeature included label="3 dialogue rounds per table" />
            <PlanFeature included label="Export raw chat" />
            <PlanFeature included={false} label="AI Transcript" />
            <PlanFeature included={false} label="Position Analysis" />
            <PlanFeature included={false} label="Literature Review (APA)" />
            <PlanFeature included={false} label="Bilingual Summary" />
            <PlanFeature included={false} label="Podcast Export" />
            <PlanFeature included={false} label="Mind Map" />
          </ul>
        </div>

        {/* Paper Pack */}
        <div className={`rounded-2xl border p-7 ${
          currentPlan === "paper_pack"
            ? "border-blue-400/40 bg-party-card"
            : "border-blue-400/20 bg-party-card/50"
        }`}>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-blue-400">Paper Pack</h3>
            <p className="mt-1 text-3xl font-bold">
              $7.99
            </p>
            <p className="mt-1 text-xs text-party-muted">
              one-time / 5 papers
            </p>
            <p className="mt-2 text-sm text-party-muted">
              Pay as you go, no subscription
            </p>
          </div>

          {currentPlan === "paper_pack" ? (
            <div className="mb-6 rounded-lg bg-blue-400/10 px-3 py-1.5 text-center text-sm text-blue-400">
              Current Plan
            </div>
          ) : (
            <button
              onClick={() => onSelectPlan("paper_pack")}
              className="mb-6 w-full rounded-lg bg-blue-500 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              Buy Paper Pack
            </button>
          )}

          <ul className="space-y-3 text-sm">
            <PlanFeature included label="5 papers (never expires)" highlight />
            <PlanFeature included label="Party Overview" />
            <PlanFeature included label="Unlimited dialogue" highlight />
            <PlanFeature included label="Export raw chat" />
            <PlanFeature included label="AI Transcript" highlight />
            <PlanFeature included label="Position Analysis" highlight />
            <PlanFeature included label="Literature Review (APA)" highlight />
            <PlanFeature included label="Bilingual Summary" highlight />
            <PlanFeature included label="Podcast Export" highlight />
            <PlanFeature included label="Mind Map" highlight />
          </ul>
        </div>

        {/* Pro Plan */}
        <div className={`rounded-2xl border p-7 relative ${
          currentPlan === "pro"
            ? "border-party-gold/40 bg-party-card"
            : "border-party-gold/20 bg-gradient-to-br from-party-card to-party-bg"
        }`}>
          <div className="absolute -top-3 right-6 rounded-full bg-party-gold px-3 py-0.5 text-xs font-semibold text-black">
            BEST VALUE
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-party-gold">Pro</h3>
            <p className="mt-1 text-3xl font-bold">
              $14.99<span className="text-sm text-party-muted font-normal">/month</span>
            </p>
            <p className="mt-1 text-xs text-party-muted">
              or $119/year <span className="text-green-400">(Save 34%)</span>
            </p>
            <p className="mt-2 text-sm text-party-muted">
              Unlimited research companion
            </p>
          </div>

          {currentPlan === "pro" ? (
            <div className="mb-6 rounded-lg bg-party-gold/10 px-3 py-1.5 text-center text-sm text-party-gold">
              Current Plan
            </div>
          ) : (
            <button
              onClick={() => onSelectPlan("pro")}
              className="mb-6 w-full rounded-lg bg-party-gold py-2.5 text-sm font-semibold text-black transition hover:bg-party-gold/80"
            >
              Upgrade to Pro
            </button>
          )}

          <ul className="space-y-3 text-sm">
            <PlanFeature included label="Unlimited papers" highlight />
            <PlanFeature included label="Party Overview" />
            <PlanFeature included label="Unlimited dialogue" highlight />
            <PlanFeature included label="Export raw chat" />
            <PlanFeature included label="AI Transcript" highlight />
            <PlanFeature included label="Position Analysis" highlight />
            <PlanFeature included label="Literature Review (APA)" highlight />
            <PlanFeature included label="Bilingual Summary" highlight />
            <PlanFeature included label="Podcast Export" highlight />
            <PlanFeature included label="Mind Map" highlight />
            <PlanFeature included label="Priority support" highlight />
          </ul>
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-2xl mt-12">
        <h3 className="text-lg font-semibold mb-4 text-center">FAQ</h3>
        <div className="space-y-4">
          <FaqItem
            q="What's the difference between Paper Pack and Pro?"
            a="Paper Pack is a one-time purchase for 3 papers — perfect if you're working on a specific project. Pro gives you unlimited access every month for ongoing research."
          />
          <FaqItem
            q="Do Paper Pack credits expire?"
            a="No! Your 3 paper credits never expire. Use them whenever you need."
          />
          <FaqItem
            q="Can I cancel Pro anytime?"
            a="Yes, cancel anytime. You'll keep access until the end of your billing period."
          />
          <FaqItem
            q="What counts as one 'paper'?"
            a="Each PDF you upload counts as one paper. Re-entering a previously analyzed party doesn't count."
          />
        </div>
      </div>
    </div>
  );
}

function PlanFeature({
  included,
  label,
  highlight,
}: {
  included: boolean;
  label: string;
  highlight?: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      <span className={included ? "text-green-400" : "text-party-muted/40"}>
        {included ? CHECK : CROSS}
      </span>
      <span className={highlight ? "text-party-text" : "text-party-muted"}>
        {label}
      </span>
    </li>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl bg-party-card/50 border border-party-accent/10 p-4">
      <p className="text-sm font-medium text-party-text mb-1">{q}</p>
      <p className="text-sm text-party-muted">{a}</p>
    </div>
  );
}

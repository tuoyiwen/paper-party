interface Props {
  currentPlan: "free" | "pro";
  onUpgrade: () => void;
  onBack: () => void;
}

const CHECK = "✓";
const CROSS = "—";

export default function Pricing({ currentPlan, onUpgrade, onBack }: Props) {
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

      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        {/* Free Plan */}
        <div className={`rounded-2xl border p-8 ${
          currentPlan === "free"
            ? "border-party-accent/40 bg-party-card"
            : "border-party-accent/10 bg-party-card/50"
        }`}>
          <div className="mb-6">
            <h3 className="text-xl font-bold">Free</h3>
            <p className="mt-1 text-3xl font-bold">
              $0<span className="text-sm text-party-muted font-normal">/month</span>
            </p>
            <p className="mt-2 text-sm text-party-muted">
              Get started with literature exploration
            </p>
          </div>

          {currentPlan === "free" && (
            <div className="mb-6 rounded-lg bg-party-accent/10 px-3 py-1.5 text-center text-sm text-party-accent">
              Current Plan
            </div>
          )}

          <ul className="space-y-3 text-sm">
            <PlanFeature included label="3 papers per month" />
            <PlanFeature included label="Party Overview" />
            <PlanFeature included label="5 dialogue rounds per table" />
            <PlanFeature included label="5 history entries" />
            <PlanFeature included={false} label="Download Transcript" />
            <PlanFeature included={false} label="Position Analysis" />
            <PlanFeature included={false} label="Bilingual Summary" />
            <PlanFeature included={false} label="Podcast Export" />
            <PlanFeature included={false} label="Interactive Mind Map" />
          </ul>
        </div>

        {/* Pro Plan */}
        <div className={`rounded-2xl border p-8 relative ${
          currentPlan === "pro"
            ? "border-party-gold/40 bg-party-card"
            : "border-party-gold/20 bg-gradient-to-br from-party-card to-party-bg"
        }`}>
          <div className="absolute -top-3 right-6 rounded-full bg-party-gold px-3 py-0.5 text-xs font-semibold text-black">
            RECOMMENDED
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-party-gold">Pro</h3>
            <p className="mt-1 text-3xl font-bold">
              $9.99<span className="text-sm text-party-muted font-normal">/month</span>
            </p>
            <p className="mt-1 text-xs text-party-muted">
              or $99/year (save 17%)
            </p>
            <p className="mt-2 text-sm text-party-muted">
              Full-powered academic research companion
            </p>
          </div>

          {currentPlan === "pro" ? (
            <div className="mb-6 rounded-lg bg-party-gold/10 px-3 py-1.5 text-center text-sm text-party-gold">
              Current Plan
            </div>
          ) : (
            <button
              onClick={onUpgrade}
              className="mb-6 w-full rounded-lg bg-party-gold py-2.5 text-sm font-semibold text-black transition hover:bg-party-gold/80"
            >
              Upgrade to Pro
            </button>
          )}

          <ul className="space-y-3 text-sm">
            <PlanFeature included label="Unlimited papers" highlight />
            <PlanFeature included label="Party Overview" />
            <PlanFeature included label="Unlimited dialogue rounds" highlight />
            <PlanFeature included label="Unlimited history" highlight />
            <PlanFeature included label="Download Transcript" highlight />
            <PlanFeature included label="Position Analysis" highlight />
            <PlanFeature included label="Bilingual Summary (EN/CN)" highlight />
            <PlanFeature included label="Podcast Export (AI voices)" highlight />
            <PlanFeature included label="Interactive Mind Map" highlight />
          </ul>
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

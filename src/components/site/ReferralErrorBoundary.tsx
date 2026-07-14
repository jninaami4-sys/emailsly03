import { Component, type ReactNode } from "react";
import { Gift, AlertCircle } from "lucide-react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

type Props = {
  children: ReactNode;
  /** Optional custom fallback. If omitted, a compact default card is shown. */
  fallback?: ReactNode;
  /** Label used in the default fallback ("wallet", "credit", etc.). */
  label?: string;
};

type State = { hasError: boolean };

/**
 * Isolates referral widgets so that a failure inside the referral service
 * (unauthorized, network, RPC error) never blanks the surrounding page
 * (dashboard, checkout, order builder).
 */
export class ReferralErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    reportLovableError(error, { boundary: "ReferralErrorBoundary" });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;

    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-neon-orange/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-neon-orange">
          <Gift className="size-3" /> Referral {this.props.label ?? "wallet"}
        </div>
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-border bg-background/60 p-3 text-xs text-muted-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-neon-orange" />
          <div>
            <p className="font-semibold text-foreground">Referral info is unavailable right now.</p>
            <p className="mt-0.5">
              This won't affect the rest of your {this.props.label === "credit" ? "checkout" : "dashboard"}. Try refreshing in a moment.
            </p>
          </div>
        </div>
      </div>
    );
  }
}

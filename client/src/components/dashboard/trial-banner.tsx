import { Link } from "wouter";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Sparkles, ArrowRight, AlertTriangle } from "lucide-react";

// Banner shown when the user is on their free 14-day trial OR when the trial
// just expired (basic tier + trial_ends_at in the past, but only for ~30 days
// after expiry so we don't nag forever).
export function TrialBanner() {
  const { profile, isOnTrial, daysLeftInTrial, trialEndsAt } = useUserProfile();
  if (!profile) return null;

  // Active trial: show how many days are left + upgrade CTA.
  if (isOnTrial) {
    const isUrgent = daysLeftInTrial <= 3;
    return (
      <div
        data-testid="trial-banner-active"
        className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm border-b ${
          isUrgent
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-primary/10 border-primary/20"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className={`h-4 w-4 shrink-0 ${isUrgent ? "text-amber-500" : "text-primary"}`} />
          <span className="truncate">
            <strong>{daysLeftInTrial} day{daysLeftInTrial === 1 ? "" : "s"} left</strong> in your free Growth trial.
            {isUrgent && " Upgrade now to keep your library, custom domain, and affiliate program."}
          </span>
        </div>
        <Link
          href="/#pricing"
          className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity shrink-0"
          data-testid="link-trial-upgrade"
        >
          Upgrade
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  // Recently-expired trial: nag for 30 days, then drop the banner.
  if (
    profile.planTier === "basic" &&
    trialEndsAt &&
    new Date(trialEndsAt) < new Date() &&
    new Date(trialEndsAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ) {
    return (
      <div
        data-testid="trial-banner-expired"
        className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm border-b bg-muted/50 border-border"
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground">
            <strong className="text-foreground">Your Growth trial ended.</strong> You're now on the Starter plan
            — the library, custom domain, and affiliate program are locked.
          </span>
        </div>
        <Link
          href="/#pricing"
          className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity shrink-0"
          data-testid="link-trial-expired-upgrade"
        >
          Upgrade
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return null;
}

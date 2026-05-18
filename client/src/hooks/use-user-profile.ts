import { useQuery } from "@tanstack/react-query";
import type { PlanTier } from "@shared/schema";
import { PLAN_FEATURES, canAccessTier } from "@shared/schema";

export type UserProfileData = {
  userId: string;
  planTier: PlanTier;
  isAdmin: boolean;
  features: typeof PLAN_FEATURES["basic"];
  isOnTrial?: boolean;
  trialEndsAt?: string | null;
};

export function useUserProfile() {
  const { data, isLoading } = useQuery<UserProfileData>({
    queryKey: ["/api/user/profile"],
  });

  // Days remaining in trial, or 0 if not on trial / expired
  const daysLeftInTrial = (() => {
    if (!data?.isOnTrial || !data.trialEndsAt) return 0;
    const ms = new Date(data.trialEndsAt).getTime() - Date.now();
    if (ms <= 0) return 0;
    return Math.ceil(ms / (24 * 60 * 60 * 1000));
  })();

  return {
    profile: data,
    isLoading,
    tier: (data?.planTier || "basic") as PlanTier,
    features: data?.features || PLAN_FEATURES.basic,
    isAdmin: data?.isAdmin || false,
    isOnTrial: !!data?.isOnTrial,
    trialEndsAt: data?.trialEndsAt ?? null,
    daysLeftInTrial,
    canAccess: (requiredTier: PlanTier) => canAccessTier((data?.planTier || "basic") as PlanTier, requiredTier),
  };
}

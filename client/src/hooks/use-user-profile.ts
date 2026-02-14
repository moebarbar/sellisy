import { useQuery } from "@tanstack/react-query";
import type { PlanTier } from "@shared/schema";
import { PLAN_FEATURES, canAccessTier } from "@shared/schema";

export type UserProfileData = {
  userId: string;
  planTier: PlanTier;
  isAdmin: boolean;
  features: typeof PLAN_FEATURES["basic"];
};

export function useUserProfile() {
  const { data, isLoading } = useQuery<UserProfileData>({
    queryKey: ["/api/user/profile"],
  });

  return {
    profile: data,
    isLoading,
    tier: (data?.planTier || "basic") as PlanTier,
    features: data?.features || PLAN_FEATURES.basic,
    isAdmin: data?.isAdmin || false,
    canAccess: (requiredTier: PlanTier) => canAccessTier((data?.planTier || "basic") as PlanTier, requiredTier),
  };
}

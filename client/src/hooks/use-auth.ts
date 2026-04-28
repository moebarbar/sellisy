import { useUser, useClerk } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

// The Clerk hook gives us identity; the local user row carries Sellisy-specific
// fields (id, profile, plan tier resolution). We query /api/auth/user once a
// Clerk session exists, then expose a unified shape so existing callers don't
// have to change.
export function useAuth() {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const clerk = useClerk();

  const { data: sellisyUser, isLoading: isLoadingLocal } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    enabled: !!isSignedIn,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logout = () => {
    clerk.signOut({ redirectUrl: "/" });
  };

  return {
    user: sellisyUser ?? null,
    clerkUser,
    isLoading: !isLoaded || (isSignedIn && isLoadingLocal),
    isAuthenticated: !!isSignedIn,
    logout,
    isLoggingOut: false,
  };
}

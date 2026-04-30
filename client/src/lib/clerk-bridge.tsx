import { useEffect } from "react";
import { useAuth as useClerkAuth } from "@clerk/react";
import { setClerkTokenGetter } from "./queryClient";

// Bridges Clerk's getToken() into the shared apiRequest/getQueryFn so every
// outbound request carries a valid Authorization header. Mount once near the
// app root, inside <ClerkProvider>.
export function ClerkAuthBridge() {
  const { getToken, isLoaded } = useClerkAuth();

  useEffect(() => {
    if (!isLoaded) return;
    setClerkTokenGetter(() => getToken());
    return () => setClerkTokenGetter(null);
  }, [isLoaded, getToken]);

  return null;
}

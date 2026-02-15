import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AccountVerifyPage() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    const rawRedirect = params.get("redirect");
    const redirect = rawRedirect && rawRedirect.startsWith("/s/") && rawRedirect.includes("/portal") ? rawRedirect : null;
    if (!token) {
      setStatus("error");
      setErrorMsg("Missing token");
      return;
    }

    fetch(`/api/customer/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
          queryClient.invalidateQueries({ queryKey: ["/api/customer/me"] });
          const destination = redirect || "/account/purchases";
          setTimeout(() => navigate(destination), 1500);
        } else {
          const data = await res.json();
          setStatus("error");
          setErrorMsg(data.message || "Verification failed");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Network error. Please try again.");
      });
  }, [search, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <h2 className="text-lg font-semibold" data-testid="text-verify-status">Verifying your login...</h2>
            <p className="text-sm text-muted-foreground">Please wait a moment</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
            <h2 className="text-lg font-semibold" data-testid="text-verify-status">You're logged in!</h2>
            <p className="text-sm text-muted-foreground">Redirecting to your purchases...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold" data-testid="text-verify-status">Login failed</h2>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <Link href="/account">
              <Button data-testid="button-try-again">Try Again</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

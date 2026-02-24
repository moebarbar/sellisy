const SESSION_KEY = "sellisy_session_id";

function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

type EventType = "page_view" | "product_view" | "bundle_view" | "checkout_start" | "add_to_cart";

export function trackEvent(
  storeId: string,
  eventType: EventType,
  opts?: { productId?: string; bundleId?: string; path?: string },
) {
  const payload = {
    storeId,
    sessionId: getSessionId(),
    eventType,
    productId: opts?.productId,
    bundleId: opts?.bundleId,
    path: opts?.path || window.location.pathname,
    referrer: document.referrer || undefined,
  };

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/store-events", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  } else {
    fetch("/api/store-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }
}

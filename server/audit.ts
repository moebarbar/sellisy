/**
 * Structured audit logger for security-relevant events.
 * Outputs JSON to stdout — compatible with any log aggregation system
 * (Datadog, Betterstack, Railway logs, etc.).
 *
 * Never log: passwords, session tokens, full credit card numbers, API keys.
 */

export type AuditEvent =
  | "auth.login.success"
  | "auth.login.failed"
  | "auth.logout"
  | "auth.register.success"
  | "auth.register.failed"
  | "auth.password_change"
  | "auth.magic_link.sent"
  | "auth.magic_link.verified"
  | "auth.magic_link.failed"
  | "auth.provision.failed"
  | "authz.denied"
  | "admin.role_change"
  | "admin.plan_change"
  | "store.created"
  | "store.deleted"
  | "payment.checkout_started"
  | "payment.completed"
  | "payment.failed"
  | "webhook.received"
  | "webhook.duplicate"
  | "subscription.canceled"
  | "ai.launch_queued"
  | "webhook.replay_rejected"
  | "order.refunded"
  | "affiliate.commission_created"
  | "affiliate.self_attribution_blocked"
  | "affiliate.applied"
  | "affiliate.approved"
  | "affiliate.created"
  | "affiliate.settings_updated"
  | "affiliate.payout_created"
  | "affiliate.payout_marked_paid"
  | "rate_limit.hit"
  | "data.export"
  | "queue.job_failed"
  | "queue.job_dead";

interface AuditPayload {
  event: AuditEvent;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  details?: string;
  storeId?: string;
  orderId?: string;
  [key: string]: string | number | boolean | undefined;
}

export function audit(payload: AuditPayload): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level: "audit",
    service: "sellisy",
    environment: process.env.NODE_ENV || "development",
    ...payload,
  };
  // Use process.stdout directly to avoid any logger interception
  process.stdout.write(JSON.stringify(entry) + "\n");
}

/**
 * Extract safe request metadata for audit logs.
 * Never includes body content.
 */
export function auditMeta(req: { headers: Record<string, string | string[] | undefined>; ip?: string; socket?: { remoteAddress?: string } }) {
  // Trust only Cloudflare's CF-Connecting-IP (set at our edge) or req.ip
  // (Express, honoring `trust proxy`). The leftmost X-Forwarded-For token is
  // client-supplied and spoofable — using it lets an attacker forge the IP in
  // security audit logs.
  const cf = req.headers["cf-connecting-ip"];
  const ip = (typeof cf === "string" && cf.trim())
    || req.ip
    || req.socket?.remoteAddress
    || "unknown";
  const userAgent = (req.headers["user-agent"] as string | undefined) || "unknown";
  return { ip, userAgent };
}

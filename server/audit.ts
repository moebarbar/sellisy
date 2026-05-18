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
  | "data.export";

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
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string"
    ? forwarded.split(",")[0].trim()
    : req.ip || req.socket?.remoteAddress || "unknown";
  const userAgent = (req.headers["user-agent"] as string | undefined) || "unknown";
  return { ip, userAgent };
}

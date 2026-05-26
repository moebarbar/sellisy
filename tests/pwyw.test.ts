import { describe, it, expect } from "vitest";
import { validatePwywAmount } from "@shared/pwyw";

describe("validatePwywAmount", () => {
  it("rejects when amount is missing", () => {
    const r = validatePwywAmount({ pwywEnabled: true, pwywMinCents: 0, amountCents: undefined });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("invalid_amount");
  });

  it("rejects when product doesn't have PWYW enabled", () => {
    const r = validatePwywAmount({ pwywEnabled: false, pwywMinCents: 0, amountCents: 500 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("not_enabled");
  });

  it("rejects negative amounts", () => {
    const r = validatePwywAmount({ pwywEnabled: true, pwywMinCents: 0, amountCents: -100 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("invalid_amount");
  });

  it("rejects NaN / Infinity", () => {
    expect(validatePwywAmount({ pwywEnabled: true, pwywMinCents: 0, amountCents: NaN }).ok).toBe(false);
    expect(validatePwywAmount({ pwywEnabled: true, pwywMinCents: 0, amountCents: Infinity }).ok).toBe(false);
  });

  it("rejects amount below minimum", () => {
    const r = validatePwywAmount({ pwywEnabled: true, pwywMinCents: 500, amountCents: 100 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("below_minimum");
      expect(r.message).toContain("$5.00");
    }
  });

  it("accepts amount exactly at minimum", () => {
    const r = validatePwywAmount({ pwywEnabled: true, pwywMinCents: 500, amountCents: 500 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.priceCents).toBe(500);
  });

  it("accepts amount above minimum", () => {
    const r = validatePwywAmount({ pwywEnabled: true, pwywMinCents: 500, amountCents: 12345 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.priceCents).toBe(12345);
  });

  it("accepts zero when minimum is zero (true tip-jar PWYW)", () => {
    const r = validatePwywAmount({ pwywEnabled: true, pwywMinCents: 0, amountCents: 0 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.priceCents).toBe(0);
  });

  it("rounds non-integer amounts to nearest cent", () => {
    const r = validatePwywAmount({ pwywEnabled: true, pwywMinCents: 0, amountCents: 1234.6 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.priceCents).toBe(1235);
  });
});

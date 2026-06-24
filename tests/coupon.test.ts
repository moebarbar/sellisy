import { describe, it, expect } from "vitest";
import { applyCouponDiscount } from "@shared/coupon";

describe("applyCouponDiscount", () => {
  describe("PERCENT", () => {
    it("takes a whole percent off", () => {
      expect(applyCouponDiscount(2000, "PERCENT", 20)).toBe(1600);
    });

    it("rounds to the nearest cent (stays integer-cent)", () => {
      // 999 * 0.9 = 899.1 → 899
      expect(applyCouponDiscount(999, "PERCENT", 10)).toBe(899);
      // 1995 * (1 - 0.333... ) — use 33% → 1336.65 → 1337
      expect(applyCouponDiscount(1995, "PERCENT", 33)).toBe(1337);
    });

    it("100% off yields a free order", () => {
      expect(applyCouponDiscount(4999, "PERCENT", 100)).toBe(0);
    });

    it("0% off is a no-op", () => {
      expect(applyCouponDiscount(4999, "PERCENT", 0)).toBe(4999);
    });

    it("never goes below zero even past 100%", () => {
      expect(applyCouponDiscount(1000, "PERCENT", 150)).toBe(0);
    });
  });

  describe("FIXED", () => {
    it("subtracts a cents amount", () => {
      expect(applyCouponDiscount(2000, "FIXED", 500)).toBe(1500);
    });

    it("floors at zero — an over-large fixed discount can't create a negative total", () => {
      expect(applyCouponDiscount(300, "FIXED", 500)).toBe(0);
    });

    it("a fixed discount equal to the total yields a free order", () => {
      expect(applyCouponDiscount(1500, "FIXED", 1500)).toBe(0);
    });

    it("zero discount is a no-op", () => {
      expect(applyCouponDiscount(1500, "FIXED", 0)).toBe(1500);
    });
  });

  it("handles a zero-priced order without going negative", () => {
    expect(applyCouponDiscount(0, "PERCENT", 50)).toBe(0);
    expect(applyCouponDiscount(0, "FIXED", 500)).toBe(0);
  });
});

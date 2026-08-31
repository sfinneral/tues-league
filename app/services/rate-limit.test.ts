import { beforeEach, describe, expect, it } from "vitest";

import {
  getClientIp,
  isRateLimited,
  resetRateLimits,
} from "./rate-limit.server";

describe("isRateLimited", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows requests while under the limit", () => {
    expect(isRateLimited("a@example.com", { max: 3, windowMs: 1000 })).toBe(
      false,
    );
    expect(isRateLimited("a@example.com", { max: 3, windowMs: 1000 })).toBe(
      false,
    );
    expect(isRateLimited("a@example.com", { max: 3, windowMs: 1000 })).toBe(
      false,
    );
  });

  it("blocks requests once the limit is exceeded within the window", () => {
    isRateLimited("b@example.com", { max: 2, windowMs: 1000 });
    isRateLimited("b@example.com", { max: 2, windowMs: 1000 });
    expect(isRateLimited("b@example.com", { max: 2, windowMs: 1000 })).toBe(
      true,
    );
  });

  it("tracks each key independently", () => {
    isRateLimited("c@example.com", { max: 1, windowMs: 1000 });
    expect(isRateLimited("d@example.com", { max: 1, windowMs: 1000 })).toBe(
      false,
    );
  });

  it("allows requests again once the window has elapsed", () => {
    const now = Date.now();
    isRateLimited("e@example.com", { max: 1, windowMs: 1000 }, now);
    expect(
      isRateLimited("e@example.com", { max: 1, windowMs: 1000 }, now + 1001),
    ).toBe(false);
  });
});

describe("getClientIp", () => {
  it("returns the Fly-Client-IP header value", () => {
    const request = new Request("http://localhost", {
      headers: { "Fly-Client-IP": "203.0.113.5" },
    });
    expect(getClientIp(request)).toBe("203.0.113.5");
  });

  it("returns 'unknown' when the header is absent", () => {
    const request = new Request("http://localhost");
    expect(getClientIp(request)).toBe("unknown");
  });

  it("ignores a client-supplied X-Forwarded-For header", () => {
    const request = new Request("http://localhost", {
      headers: { "X-Forwarded-For": "1.2.3.4" },
    });
    expect(getClientIp(request)).toBe("unknown");
  });
});

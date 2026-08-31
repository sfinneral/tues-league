import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyTurnstileToken } from "./turnstile.server";

describe("verifyTurnstileToken", () => {
  const originalSecret = process.env.TURNSTILE_SECRET_KEY;

  afterEach(() => {
    process.env.TURNSTILE_SECRET_KEY = originalSecret;
    vi.unstubAllGlobals();
  });

  it("returns false without calling Cloudflare when the token is missing", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    expect(await verifyTurnstileToken(null)).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns false when the secret key is not configured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    expect(await verifyTurnstileToken("some-token")).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns true when Cloudflare confirms the token is valid", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ success: true }),
      }),
    );

    expect(await verifyTurnstileToken("valid-token")).toBe(true);
  });

  it("returns false when Cloudflare rejects the token", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          success: false,
          "error-codes": ["invalid-input-response"],
        }),
      }),
    );

    expect(await verifyTurnstileToken("bad-token")).toBe(false);
  });
});

interface TurnstileVerifyResponse {
  success: boolean;
}

export async function verifyTurnstileToken(
  token: FormDataEntryValue | null,
  remoteIp?: string,
): Promise<boolean> {
  if (typeof token !== "string" || token.length === 0) return false;

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body },
  );
  const data: TurnstileVerifyResponse = await response.json();
  return data.success === true;
}

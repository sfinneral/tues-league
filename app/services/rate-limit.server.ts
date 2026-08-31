interface RateLimitOptions {
  max: number;
  windowMs: number;
}

const hits = new Map<string, number[]>();

export function isRateLimited(
  key: string,
  { max, windowMs }: RateLimitOptions,
  now: number = Date.now(),
): boolean {
  const recent = (hits.get(key) ?? []).filter(
    (timestamp) => now - timestamp < windowMs,
  );

  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);
  return false;
}

export function resetRateLimits() {
  hits.clear();
}

export function getClientIp(request: Request): string {
  return request.headers.get("Fly-Client-IP") ?? "unknown";
}

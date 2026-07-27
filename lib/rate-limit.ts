import "server-only";
import { prisma } from "@/lib/db";

export async function checkRateLimit(input: {
  bucket: string;
  limit: number;
  windowMs: number;
}): Promise<{ ok: true; remaining: number } | { ok: false; retryAfterMs: number }> {
  const windowStart = new Date(
    Math.floor(Date.now() / input.windowMs) * input.windowMs,
  );

  const row = await prisma.rateLimit.upsert({
    where: {
      bucket_windowStart: {
        bucket: input.bucket,
        windowStart,
      },
    },
    create: {
      bucket: input.bucket,
      windowStart,
      count: 1,
    },
    update: {
      count: { increment: 1 },
    },
  });

  if (row.count > input.limit) {
    const retryAfterMs =
      input.windowMs - (Date.now() - windowStart.getTime());
    return { ok: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }

  return { ok: true, remaining: Math.max(input.limit - row.count, 0) };
}

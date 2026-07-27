import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { hash, verify } from "@node-rs/argon2";
import { prisma } from "@/lib/db";

export async function hashPassword(password: string) {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

export async function verifyPassword(hashValue: string, password: string) {
  return verify(hashValue, password);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashApiKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function safeEqualHex(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function verifyApiKey(
  rawKey: string,
  scope: "content" | "code",
) {
  const keyHash = hashApiKey(rawKey);
  const row = await prisma.apiKey.findFirst({
    where: { keyHash, scope, revokedAt: null },
  });
  if (!row) return null;
  if (!safeEqualHex(row.keyHash, keyHash)) return null;
  await prisma.apiKey.update({
    where: { id: row.id },
    data: { lastUsedAt: new Date() },
  });
  return row;
}

/** Client IP behind Traefik / reverse proxy. */
export function getClientIp(headers: Headers): string {
  const trusted = (process.env.TRUSTED_PROXIES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const xff = headers.get("x-forwarded-for");
  if (xff && trusted.length > 0) {
    const parts = xff.split(",").map((s) => s.trim());
    return parts[0] ?? "0.0.0.0";
  }

  return headers.get("x-real-ip")?.trim() || "0.0.0.0";
}

export function visitorIdFromRequest(ip: string, userAgent: string) {
  const salt = process.env.ANALYTICS_DAILY_SALT ?? "dev-salt";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${ip}|${userAgent}|${salt}|${day}`)
    .digest("hex");
}

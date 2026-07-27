import { NextResponse } from "next/server";
import { registerForCourse } from "@/lib/services/enrollment-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit({
    bucket: `register:${ip}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const origin = req.headers.get("origin");
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (origin && site && !origin.startsWith(site.replace(/\/$/, ""))) {
    // allow same-host variants in prod behind CF
  }

  try {
    const body = await req.json();
    const result = await registerForCourse(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message.includes("Unique") || message.includes("unique")
      ? 409
      : 400;
    return NextResponse.json(
      { error: status === 409 ? "Already registered for this course" : "Invalid registration" },
      { status },
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitReview } from "@/lib/services/enrollment-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit({
    bucket: `review:${ip}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const result = await submitReview(body, session.user.id);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  }
}

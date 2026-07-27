import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trackEventSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (req.headers.get("dnt") === "1") {
    return new NextResponse(null, { status: 204 });
  }

  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit({
    bucket: `track:${ip}`,
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!rl.ok) {
    return new NextResponse(null, { status: 204 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const parsed = trackEventSchema.safeParse(json);
  if (!parsed.success) {
    return new NextResponse(null, { status: 204 });
  }

  const data = parsed.data;
  if (data.path.startsWith("/admin") || data.path.startsWith("/student")) {
    return new NextResponse(null, { status: 204 });
  }

  const ua = req.headers.get("user-agent") ?? "";
  if (/bot|crawl|spider|slurp|facebookexternalhit/i.test(ua)) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await prisma.pageView.create({
      data: {
        path: data.path,
        referrer: data.referrer,
        visitorId: data.visitorId,
        sessionId: data.sessionId,
        deviceType: data.deviceType,
        viewportBucket: data.viewportBucket,
        browser: data.browser,
        durationMs: data.durationMs,
      },
    });

    if (data.events?.length) {
      await prisma.event.createMany({
        data: data.events
          .filter((e) => e.target !== "pageview")
          .map((e) => ({
            name: e.name,
            path: e.path,
            target: e.target,
            meta: e.meta,
            visitorId: data.visitorId,
            sessionId: data.sessionId,
          })),
      });
    }
  } catch (err) {
    console.error("track_failed", err);
  }

  return new NextResponse(null, { status: 204 });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/crypto";
import { contentTools } from "@/lib/agent/tools/content";

export const runtime = "nodejs";

const schema = z.object({
  message: z.string().min(1).max(500),
});

/** Public sandbox — read-only course stats only, hard rate limit. */
export async function POST(req: Request) {
  if (process.env.AGENTS_DISABLED === "true") {
    return NextResponse.json({ error: "Disabled" }, { status: 503 });
  }

  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit({
    bucket: `agent-demo:${ip}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const body = schema.parse(await req.json());
  const m = body.message.toLowerCase();

  if (m.includes("delete") || m.includes("update") || m.includes("create")) {
    return NextResponse.json({
      proposal: {
        tool: "delete_or_mutate",
        status: "blocked_at_approval_gate",
        note: "Destructive tools are not available in the public sandbox. On the real content agent they create a PendingChange for admin approval.",
      },
    });
  }

  const stats = await contentTools.course_stats_readonly();
  return NextResponse.json({
    proposal: {
      tool: "course_stats_readonly",
      args: {},
    },
    observation: stats.result,
    message: body.message,
  });
}

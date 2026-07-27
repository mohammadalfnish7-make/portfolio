import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyApiKey, getClientIp } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { contentTools, type ContentToolName } from "@/lib/agent/tools/content";

export const runtime = "nodejs";

const bodySchema = z.object({
  message: z.string().min(1).max(4000).optional(),
  tool: z
    .enum([
      "create_project",
      "update_project",
      "delete_project",
      "update_content",
      "query_analytics",
      "course_stats_readonly",
    ])
    .optional(),
  args: z.unknown().optional(),
});

/**
 * Content agent endpoint.
 * For v1 without a live LLM key, supports direct tool invocation with API key + Idempotency-Key.
 * When OPENAI_API_KEY / ANTHROPIC_API_KEY is set, `message` can drive a simple tool-selection loop.
 */
export async function POST(req: Request) {
  if (process.env.AGENTS_DISABLED === "true") {
    return NextResponse.json({ error: "Disabled" }, { status: 503 });
  }

  const apiKey = req.headers.get("x-api-key") ?? "";
  const key = await verifyApiKey(apiKey, "content");
  if (!key) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit({
    bucket: `agent-content:${ip}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limited", retryable: true },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
        },
      },
    );
  }

  const idem = req.headers.get("idempotency-key");
  if (!idem) {
    return NextResponse.json(
      { error: "Idempotency-Key header required", retryable: false },
      { status: 400 },
    );
  }

  const json = bodySchema.parse(await req.json());
  const actor = `api-key:${key.id}`;

  // Monthly token budget placeholder (LLM path)
  const budget = Number(process.env.AGENT_MONTHLY_TOKEN_BUDGET ?? "500000");
  if (budget <= 0) {
    return NextResponse.json(
      { error: "Monthly token budget exhausted", retryable: false },
      { status: 402 },
    );
  }

  let tool = json.tool as ContentToolName | undefined;
  if (!tool && json.message) {
    // Minimal heuristic router until a provider key is configured
    const m = json.message.toLowerCase();
    if (m.includes("analytics")) tool = "query_analytics";
    else if (m.includes("seat") || m.includes("course stat"))
      tool = "course_stats_readonly";
    else {
      return NextResponse.json({
        proposal: {
          note: "Set tool+args explicitly, or configure an LLM provider for natural-language routing.",
          message: json.message,
        },
      });
    }
  }

  if (!tool) {
    return NextResponse.json(
      { error: "Provide tool or message", retryable: false },
      { status: 400 },
    );
  }

  try {
    let out;
    if (tool === "query_analytics") {
      out = await contentTools.query_analytics();
    } else if (tool === "course_stats_readonly") {
      out = await contentTools.course_stats_readonly();
    } else if (tool === "create_project") {
      out = await contentTools.create_project(json.args ?? {}, actor, idem);
    } else if (tool === "update_project") {
      out = await contentTools.update_project(
        (json.args ?? { id: "" }) as { id: string } & Record<string, unknown>,
        actor,
        idem,
      );
    } else if (tool === "delete_project") {
      out = await contentTools.delete_project(
        (json.args ?? { id: "" }) as { id: string },
        actor,
        idem,
      );
    } else {
      out = await contentTools.update_content(
        (json.args ?? { key: "", value: null }) as {
          key: string;
          value: unknown;
        },
        actor,
        idem,
      );
    }
    return NextResponse.json(out, {
      headers: { "X-RateLimit-Remaining": String(rl.remaining) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool failed";
    return NextResponse.json(
      { error: message, retryable: false, recoveryHint: "Validate args against schema" },
      { status: 400 },
    );
  }
}

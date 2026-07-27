import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyApiKey, getClientIp } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const bodySchema = z.object({
  prompt: z.string().min(10).max(8000),
  agentId: z.string().optional(),
});

/**
 * Code agent: launches Cursor SDK cloud agent to open a PR.
 * Requires CURSOR_API_KEY and REPO_URL. No auto-merge.
 */
export async function POST(req: Request) {
  if (process.env.AGENTS_DISABLED === "true") {
    return NextResponse.json({ error: "Disabled" }, { status: 503 });
  }

  const apiKey = req.headers.get("x-api-key") ?? "";
  const key = await verifyApiKey(apiKey, "code");
  if (!key) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit({
    bucket: `agent-code:${ip}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const body = bodySchema.parse(await req.json());
  const task = await prisma.agentTask.create({
    data: {
      prompt: body.prompt,
      status: "QUEUED",
      agentId: body.agentId,
    },
  });

  const cursorKey = process.env.CURSOR_API_KEY;
  const repoUrl = process.env.REPO_URL;

  if (!cursorKey || !repoUrl) {
    await prisma.agentTask.update({
      where: { id: task.id },
      data: {
        status: "FAILED",
        error: "CURSOR_API_KEY or REPO_URL not configured",
      },
    });
    return NextResponse.json(
      {
        taskId: task.id,
        error: "Cursor SDK not configured on this deployment",
        retryable: false,
      },
      { status: 503 },
    );
  }

  try {
    // Dynamic import so the app boots without the package resolved in some envs
    const { Agent } = await import("@cursor/sdk");

    let agent;
    if (body.agentId) {
      agent = await Agent.resume(body.agentId, { apiKey: cursorKey });
    } else {
      agent = await Agent.create({
        apiKey: cursorKey,
        model: { id: "composer-2.5" },
        cloud: {
          repos: [{ url: repoUrl, startingRef: "main" }],
          autoCreatePR: true,
        },
      });
    }

    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: "RUNNING", agentId: agent.agentId },
    });

    const run = await agent.send(body.prompt);
    // Best-effort: capture whatever the SDK exposes
    const runId = (run as { id?: string }).id ?? null;

    await prisma.agentTask.update({
      where: { id: task.id },
      data: {
        status: "SUCCEEDED",
        runId,
        prUrl: (run as { prUrl?: string }).prUrl ?? null,
      },
    });

    return NextResponse.json({
      taskId: task.id,
      agentId: agent.agentId,
      runId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent failed";
    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: "FAILED", error: message },
    });
    return NextResponse.json(
      { taskId: task.id, error: message, retryable: true },
      { status: 500 },
    );
  }
}

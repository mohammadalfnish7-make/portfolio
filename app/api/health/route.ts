import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      agentsDisabled: process.env.AGENTS_DISABLED === "true",
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

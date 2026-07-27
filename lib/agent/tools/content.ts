import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  createProject,
  updateProject,
  deleteProject,
  updateSiteContent,
} from "@/lib/services/content-service";
import { getAnalyticsSummary } from "@/lib/queries";

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export async function withIdempotency<T>(
  key: string,
  toolName: string,
  run: () => Promise<T>,
): Promise<{ cached: boolean; result: T | { status: "in_progress" } }> {
  const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_MS);

  try {
    await prisma.idempotencyKey.create({
      data: {
        key,
        toolName,
        status: "in_progress",
        expiresAt,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const existing = await prisma.idempotencyKey.findUnique({
        where: { key },
      });
      if (existing?.status === "completed" && existing.response != null) {
        return {
          cached: true,
          result: existing.response as T,
        };
      }
      return { cached: true, result: { status: "in_progress" } };
    }
    throw err;
  }

  const result = await run();
  await prisma.idempotencyKey.update({
    where: { key },
    data: {
      status: "completed",
      response: result as Prisma.InputJsonValue,
    },
  });
  return { cached: false, result };
}

export const contentTools = {
  create_project: async (
    args: unknown,
    actor: string,
    idempotencyKey: string,
  ) =>
    withIdempotency(idempotencyKey, "create_project", () =>
      createProject(args, actor),
    ),
  update_project: async (
    args: { id: string } & Record<string, unknown>,
    actor: string,
    idempotencyKey: string,
  ) =>
    withIdempotency(idempotencyKey, "update_project", () =>
      updateProject(args.id, args, actor),
    ),
  delete_project: async (
    args: { id: string },
    actor: string,
    idempotencyKey: string,
  ) =>
    withIdempotency(idempotencyKey, "delete_project", () =>
      deleteProject(args.id, actor, false),
    ),
  update_content: async (
    args: { key: string; value: unknown },
    actor: string,
    idempotencyKey: string,
  ) =>
    withIdempotency(idempotencyKey, "update_content", () =>
      updateSiteContent(args.key, args.value, actor),
    ),
  query_analytics: async () => ({
    cached: false,
    result: await getAnalyticsSummary(14),
  }),
  course_stats_readonly: async () => {
    const courses = await prisma.course.findMany({
      where: { published: true },
      select: {
        slug: true,
        title: true,
        capacity: true,
        seatsTaken: true,
        status: true,
        _count: { select: { enrollments: true } },
      },
    });
    return {
      cached: false,
      result: courses.map((c) => ({
        slug: c.slug,
        title: c.title,
        seatsRemaining: Math.max(c.capacity - c.seatsTaken, 0),
        registrations: c._count.enrollments,
        status: c.status,
      })),
    };
  },
};

export type ContentToolName = keyof typeof contentTools;

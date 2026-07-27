import "server-only";
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import {
  projectInputSchema,
  type ProjectInput,
} from "@/lib/validation";

async function logChange(input: {
  actor: string;
  action: string;
  entity: string;
  entityId?: string;
  args?: unknown;
  diff?: unknown;
  publicVisible?: boolean;
}) {
  await prisma.changeLog.create({
    data: {
      actor: input.actor,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      args: input.args as Prisma.InputJsonValue | undefined,
      diff: input.diff as Prisma.InputJsonValue | undefined,
      publicVisible: input.publicVisible ?? false,
    },
  });
}

async function invalidateContent(_paths: string[]) {
  revalidateTag("projects");
  revalidateTag("site-content");
}

export async function createProject(input: unknown, actor: string) {
  const data = projectInputSchema.parse(input);
  const project = await prisma.project.create({
    data: {
      title: data.title,
      slug: data.slug,
      role: data.role ?? null,
      company: data.company ?? null,
      period: data.period ?? null,
      summary: data.summary,
      problem: data.problem,
      approach: data.approach,
      outcome: data.outcome,
      tech: data.tech,
      metrics: data.metrics ?? undefined,
      demoUrl: data.demoUrl ?? null,
      repoUrl: data.repoUrl ?? null,
      diagramUrl: data.diagramUrl ?? null,
      confidential: data.confidential ?? false,
      featured: data.featured ?? false,
      published: data.published ?? false,
      sortOrder: data.sortOrder ?? 0,
    },
  });
  await logChange({
    actor,
    action: "create_project",
    entity: "Project",
    entityId: project.id,
    args: data,
    publicVisible: true,
  });
  await invalidateContent([`/work/${project.slug}`, "/work", "/"]);
  return project;
}

export async function updateProject(
  id: string,
  input: unknown,
  actor: string,
) {
  const data = projectInputSchema.partial().parse(input) as Partial<ProjectInput>;
  const before = await prisma.project.findUniqueOrThrow({ where: { id } });
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...data,
      metrics:
        data.metrics === null
          ? Prisma.JsonNull
          : data.metrics === undefined
            ? undefined
            : (data.metrics as Prisma.InputJsonValue),
    },
  });
  await logChange({
    actor,
    action: "update_project",
    entity: "Project",
    entityId: id,
    args: data,
    diff: { before, after: project },
    publicVisible: true,
  });
  await invalidateContent([`/work/${project.slug}`, "/work", "/"]);
  return project;
}

export async function deleteProject(
  id: string,
  actor: string,
  confirmed = false,
) {
  if (!confirmed) {
    const pending = await prisma.pendingChange.create({
      data: {
        actor,
        action: "delete_project",
        entity: "Project",
        payload: { id },
      },
    });
    return { status: "pending" as const, pendingChangeId: pending.id };
  }

  const project = await prisma.project.delete({ where: { id } });
  await logChange({
    actor,
    action: "delete_project",
    entity: "Project",
    entityId: id,
    args: { id },
    publicVisible: true,
  });
  await invalidateContent([`/work/${project.slug}`, "/work", "/"]);
  return { status: "deleted" as const, project };
}

export async function updateSiteContent(
  key: string,
  value: unknown,
  actor: string,
) {
  const row = await prisma.siteContent.upsert({
    where: { key },
    create: { key, value: value as Prisma.InputJsonValue },
    update: { value: value as Prisma.InputJsonValue },
  });
  await logChange({
    actor,
    action: "update_content",
    entity: "SiteContent",
    entityId: row.id,
    args: { key, value },
    publicVisible: true,
  });
  revalidateTag("site-content");
  return row;
}

export async function approvePendingChange(
  pendingId: string,
  actor: string,
  approve: boolean,
) {
  const pending = await prisma.pendingChange.findUniqueOrThrow({
    where: { id: pendingId },
  });
  if (pending.status !== "PENDING") {
    throw new Error("Change already decided");
  }

  if (!approve) {
    return prisma.pendingChange.update({
      where: { id: pendingId },
      data: { status: "REJECTED", decidedAt: new Date() },
    });
  }

  const payload = pending.payload as { id?: string };
  if (pending.action === "delete_project" && payload.id) {
    await deleteProject(payload.id, actor, true);
  }

  return prisma.pendingChange.update({
    where: { id: pendingId },
    data: { status: "APPROVED", decidedAt: new Date() },
  });
}

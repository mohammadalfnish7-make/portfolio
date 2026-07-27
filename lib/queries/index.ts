import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

export const getPublishedProjects = cache(async () => {
  return unstable_cache(
    async () =>
      prisma.project.findMany({
        where: { published: true },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
      }),
    ["projects-published"],
    { tags: ["projects"], revalidate: 3600 },
  )();
});

export const getProjectBySlug = cache(async (slug: string) => {
  return unstable_cache(
    async () =>
      prisma.project.findFirst({
        where: { slug, published: true },
      }),
    [`project-${slug}`],
    { tags: ["projects"], revalidate: 3600 },
  )();
});

export const getSiteContent = cache(async (key: string) => {
  return unstable_cache(
    async () => prisma.siteContent.findUnique({ where: { key } }),
    [`site-content-${key}`],
    { tags: ["site-content"], revalidate: 3600 },
  )();
});

export const getPublishedCourses = cache(async () => {
  return unstable_cache(
    async () =>
      prisma.course.findMany({
        where: { published: true },
        orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }],
      }),
    ["courses-published"],
    { tags: ["courses"], revalidate: 300 },
  )();
});

export const getCourseBySlug = cache(async (slug: string) => {
  return unstable_cache(
    async () =>
      prisma.course.findFirst({
        where: { slug, published: true },
        include: {
          reviews: {
            where: { status: "APPROVED" },
            orderBy: { approvedAt: "desc" },
            take: 20,
          },
        },
      }),
    [`course-${slug}`],
    { tags: ["courses", `course:${slug}`, "reviews"], revalidate: 300 },
  )();
});

export const getPublicChangeLog = cache(async (limit = 30) => {
  return unstable_cache(
    async () =>
      prisma.changeLog.findMany({
        where: { publicVisible: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ["public-changelog"],
    { tags: ["projects", "site-content"], revalidate: 120 },
  )();
});

export const getApprovedReviews = cache(async () => {
  return unstable_cache(
    async () =>
      prisma.review.findMany({
        where: { status: "APPROVED" },
        orderBy: { approvedAt: "desc" },
        take: 12,
        include: { course: { select: { title: true, slug: true } } },
      }),
    ["reviews-home"],
    { tags: ["reviews"], revalidate: 600 },
  )();
});

export async function getAnalyticsSummary(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [daily, topPaths, topEvents] = await Promise.all([
    prisma.dailyStat.findMany({
      where: { date: { gte: since } },
      orderBy: { date: "asc" },
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    prisma.event.groupBy({
      by: ["name", "target"],
      where: { createdAt: { gte: since }, name: { in: ["click", "outbound"] } },
      _count: { _all: true },
      orderBy: { _count: { name: "desc" } },
      take: 15,
    }),
  ]);

  return { daily, topPaths, topEvents };
}

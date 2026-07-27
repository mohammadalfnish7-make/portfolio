import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const [projects, courses] = await Promise.all([
    prisma.project.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.course.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticRoutes = [
    "",
    "/courses",
    "/work",
    "/about",
    "/contact",
    "/agents",
    "/architecture",
    "/privacy",
    "/terms",
    "/refunds",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...projects.map((p) => ({
      url: `${base}/work/${p.slug}`,
      lastModified: p.updatedAt,
    })),
    ...courses.map((c) => ({
      url: `${base}/courses/${c.slug}`,
      lastModified: c.updatedAt,
    })),
  ];
}

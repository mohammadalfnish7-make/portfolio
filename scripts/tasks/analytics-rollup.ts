import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  day.setUTCDate(day.getUTCDate() - 1);

  const next = new Date(day);
  next.setUTCDate(next.getUTCDate() + 1);

  const views = await prisma.pageView.groupBy({
    by: ["path"],
    where: { createdAt: { gte: day, lt: next } },
    _count: { _all: true },
  });

  for (const row of views) {
    const visitors = await prisma.pageView.findMany({
      where: {
        path: row.path,
        createdAt: { gte: day, lt: next },
      },
      distinct: ["visitorId"],
      select: { visitorId: true },
    });

    await prisma.dailyStat.upsert({
      where: { date_path: { date: day, path: row.path } },
      create: {
        date: day,
        path: row.path,
        views: row._count._all,
        visitors: visitors.length,
      },
      update: {
        views: row._count._all,
        visitors: visitors.length,
      },
    });
  }

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);
  await prisma.pageView.deleteMany({ where: { createdAt: { lt: cutoff } } });
  await prisma.event.deleteMany({ where: { createdAt: { lt: cutoff } } });

  console.log("rollup+prune done", views.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 3);

  const stale = await prisma.enrollment.findMany({
    where: {
      status: "REGISTERED",
      createdAt: { lt: cutoff },
    },
    include: { course: true },
  });

  for (const e of stale) {
    console.log(
      JSON.stringify({
        type: "stale_registration",
        id: e.id,
        name: e.name,
        email: e.email,
        course: e.course.title,
        ageDays: Math.floor(
          (Date.now() - e.createdAt.getTime()) / (24 * 60 * 60 * 1000),
        ),
      }),
    );
  }

  console.log(`stale_count=${stale.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

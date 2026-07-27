import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const soon = new Date();
  soon.setDate(soon.getDate() + 3);
  const now = new Date();

  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: "CONFIRMED",
      course: {
        startDate: { gte: now, lte: soon },
      },
    },
    include: { course: true },
  });

  for (const e of enrollments) {
    console.log(
      JSON.stringify({
        type: "reminder",
        to: e.email,
        name: e.name,
        course: e.course.title,
        start: e.course.startDate,
      }),
    );
    // Actual email send uses RESEND when configured — see lib/email.ts
  }

  console.log(`reminders_candidates=${enrollments.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

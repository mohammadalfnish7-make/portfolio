import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany({ select: { id: true } });
  let drifts = 0;
  for (const course of courses) {
    const confirmed = await prisma.enrollment.count({
      where: { courseId: course.id, status: "CONFIRMED" },
    });
    const current = await prisma.course.findUniqueOrThrow({
      where: { id: course.id },
    });
    if (current.seatsTaken !== confirmed) {
      drifts += 1;
      await prisma.course.update({
        where: { id: course.id },
        data: { seatsTaken: confirmed },
      });
    }
  }
  console.log(JSON.stringify({ checked: courses.length, drifts }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

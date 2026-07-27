import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function StudentHome() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login?callbackUrl=/student");
  if (session.user.role === "ADMIN") redirect("/admin");

  const enrollments = await prisma.enrollment.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { email: session.user.email ?? "" },
      ],
    },
    include: { course: true, payments: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-page py-12">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        My courses
      </h1>
      <p className="mt-2 text-sm text-fg-muted">{session.user.email}</p>
      <div className="mt-8 space-y-4">
        {enrollments.map((e) => (
          <div key={e.id} className="rounded-xl border border-border p-5">
            <h2 className="text-xl">{e.course.title}</h2>
            <p className="mt-1 text-sm text-fg-muted">Status: {e.status}</p>
            {e.status === "CONFIRMED" && e.course.materialsUrl && (
              <a
                href={e.course.materialsUrl}
                className="mt-3 inline-block text-accent text-sm"
                target="_blank"
                rel="noreferrer"
              >
                Materials
              </a>
            )}
            {e.status === "CONFIRMED" && (
              <Link
                href={`/student/review?courseId=${e.courseId}`}
                className="mt-3 ml-4 inline-block text-sm text-accent"
              >
                Leave a review
              </Link>
            )}
          </div>
        ))}
        {enrollments.length === 0 && (
          <p className="text-fg-muted">
            No enrollments yet.{" "}
            <Link href="/courses" className="text-accent">
              Browse courses
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

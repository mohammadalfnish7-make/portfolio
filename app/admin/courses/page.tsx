import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function AdminCoursesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login");
  }

  const courses = await prisma.course.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="container-page py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Courses
        </h1>
        <Link href="/admin" className="text-sm text-accent">
          ← Admin
        </Link>
      </div>
      <ul className="mt-8 space-y-3">
        {courses.map((c) => (
          <li key={c.id} className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-sm text-fg-muted">
                  /{c.slug} · {c.status} · {c.seatsTaken}/{c.capacity}
                </p>
              </div>
              <Link
                href={`/admin/enrollments?course=${c.slug}`}
                className="text-sm text-accent"
              >
                Roster
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-fg-muted">
        Edit course copy via seed or Prisma Studio for v1; full course editor can
        extend content-service next.
      </p>
    </div>
  );
}

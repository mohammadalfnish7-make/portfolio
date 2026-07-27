import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function AdminHome() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login");
  }

  const [registered, pendingReviews, pendingChanges, courses] =
    await Promise.all([
      prisma.enrollment.count({ where: { status: "REGISTERED" } }),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.pendingChange.count({ where: { status: "PENDING" } }),
      prisma.course.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          capacity: true,
          seatsTaken: true,
          status: true,
        },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

  return (
    <div className="container-page py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Admin
        </h1>
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/enrollments">Enrollments</Link>
          <Link href="/admin/courses">Courses</Link>
          <Link href="/admin/projects">Projects</Link>
          <Link href="/admin/reviews">Reviews</Link>
          <Link href="/admin/analytics">Analytics</Link>
          <Link href="/admin/agents">Agents</Link>
        </nav>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border p-5">
          <p className="text-sm text-fg-muted">Uncontacted registrations</p>
          <p className="mt-2 text-3xl text-warning">{registered}</p>
        </div>
        <div className="rounded-xl border border-border p-5">
          <p className="text-sm text-fg-muted">Reviews awaiting moderation</p>
          <p className="mt-2 text-3xl">{pendingReviews}</p>
        </div>
        <div className="rounded-xl border border-border p-5">
          <p className="text-sm text-fg-muted">Pending agent changes</p>
          <p className="mt-2 text-3xl">{pendingChanges}</p>
        </div>
      </div>

      <h2 className="mt-12 font-[family-name:var(--font-display)] text-2xl">
        Seats
      </h2>
      <div className="mt-4 grid gap-3">
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/admin/enrollments?course=${c.slug}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-3"
          >
            <span>{c.title}</span>
            <span className="text-sm text-fg-muted">
              {c.seatsTaken}/{c.capacity} · {c.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

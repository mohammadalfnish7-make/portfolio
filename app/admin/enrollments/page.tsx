import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  confirmEnrollment,
  setEnrollmentStatus,
} from "@/lib/services/enrollment-service";
import type { EnrollmentStatus } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login");
  }
  return session;
}

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const session = await requireAdmin();
  const sp = await searchParams;

  const enrollments = await prisma.enrollment.findMany({
    where: sp.course
      ? { course: { slug: sp.course } }
      : undefined,
    include: { course: true, payments: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  async function updateStatus(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user || s.user.role !== "ADMIN") {
      throw new Error("Forbidden");
    }
    const id = String(formData.get("id"));
    const status = String(formData.get("status")) as EnrollmentStatus;
    if (status === "CONFIRMED") {
      const result = await confirmEnrollment(id, s.user.id);
      if (!result.ok) {
        throw new Error(result.reason);
      }
    } else {
      await setEnrollmentStatus(id, status, s.user.id);
    }
    redirect("/admin/enrollments");
  }

  return (
    <div className="container-page py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Enrollments
        </h1>
        <Link href="/admin" className="text-sm text-accent">
          ← Admin
        </Link>
      </div>

      <div className="mt-8 grid gap-4 lg:hidden">
        {enrollments.map((e) => {
          const wa = e.phone.replace(/[^\d]/g, "");
          return (
            <div key={e.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">{e.name}</p>
              <p className="text-sm text-fg-muted">{e.course.title}</p>
              <p className="text-sm">{e.email}</p>
              <p className="text-sm">{e.phone}</p>
              <p className="mt-2 text-xs uppercase text-fg-muted">{e.status}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  className="rounded-md border border-border px-3 py-2 text-sm"
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
                <form action={updateStatus}>
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="status" value="CONTACTED" />
                  <button className="rounded-md border border-border px-3 py-2 text-sm">
                    Mark contacted
                  </button>
                </form>
                <form action={updateStatus}>
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="status" value="CONFIRMED" />
                  <button className="rounded-md bg-accent px-3 py-2 text-sm text-bg">
                    Confirm seat
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead className="text-fg-muted">
            <tr>
              <th className="py-2">Name</th>
              <th>Course</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => {
              const wa = e.phone.replace(/[^\d]/g, "");
              return (
                <tr key={e.id} className="border-t border-border">
                  <td className="py-3">{e.name}</td>
                  <td>{e.course.title}</td>
                  <td>
                    <div>{e.email}</div>
                    <a href={`https://wa.me/${wa}`} className="text-accent">
                      {e.phone}
                    </a>
                  </td>
                  <td>{e.status}</td>
                  <td>
                    <div className="flex gap-2">
                      <form action={updateStatus}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="status" value="CONTACTED" />
                        <button className="underline">Contacted</button>
                      </form>
                      <form action={updateStatus}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="status" value="CONFIRMED" />
                        <button className="underline text-accent">
                          Confirm
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-fg-muted">
        Signed in as {session.user.email}. Confirm uses an atomic seat check.
      </p>
    </div>
  );
}

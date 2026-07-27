import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { moderateReview } from "@/lib/services/enrollment-service";

export default async function AdminReviewsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login");
  }

  const reviews = await prisma.review.findMany({
    where: { status: "PENDING" },
    include: { course: true },
    orderBy: { createdAt: "desc" },
  });

  async function decide(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user || s.user.role !== "ADMIN") throw new Error("Forbidden");
    await moderateReview(
      String(formData.get("id")),
      String(formData.get("approve")) === "1",
      s.user.id,
    );
    redirect("/admin/reviews");
  }

  return (
    <div className="container-page py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Review moderation
        </h1>
        <Link href="/admin" className="text-sm text-accent">
          ← Admin
        </Link>
      </div>
      <div className="mt-8 space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-border p-4">
            <p className="text-sm text-fg-muted">
              {r.authorName} · {r.rating}/5 · {r.course?.title ?? "General"}
            </p>
            <p className="mt-2">{r.body}</p>
            <div className="mt-3 flex gap-2">
              <form action={decide}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="approve" value="1" />
                <button className="rounded-md bg-accent px-3 py-2 text-sm text-bg">
                  Approve
                </button>
              </form>
              <form action={decide}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="approve" value="0" />
                <button className="rounded-md border border-border px-3 py-2 text-sm">
                  Reject
                </button>
              </form>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-fg-muted text-sm">Queue empty.</p>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { approvePendingChange } from "@/lib/services/content-service";

export default async function AdminAgentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login");
  }

  const [tasks, pending] = await Promise.all([
    prisma.agentTask.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.pendingChange.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  async function decide(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user || s.user.role !== "ADMIN") throw new Error("Forbidden");
    const id = String(formData.get("id"));
    const approve = String(formData.get("approve")) === "1";
    await approvePendingChange(id, s.user.id, approve);
    redirect("/admin/agents");
  }

  return (
    <div className="container-page py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Agents
        </h1>
        <Link href="/admin" className="text-sm text-accent">
          ← Admin
        </Link>
      </div>

      <h2 className="mt-10 text-lg">Pending approvals</h2>
      <div className="mt-4 space-y-3">
        {pending.map((p) => (
          <div key={p.id} className="rounded-lg border border-border p-4">
            <p className="text-sm">
              {p.action} on {p.entity}
            </p>
            <pre className="mt-2 overflow-x-auto text-xs text-fg-muted">
              {JSON.stringify(p.payload, null, 2)}
            </pre>
            <div className="mt-3 flex gap-2">
              <form action={decide}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="approve" value="1" />
                <button className="rounded-md bg-accent px-3 py-2 text-sm text-bg">
                  Approve
                </button>
              </form>
              <form action={decide}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="approve" value="0" />
                <button className="rounded-md border border-border px-3 py-2 text-sm">
                  Reject
                </button>
              </form>
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <p className="text-sm text-fg-muted">No pending changes.</p>
        )}
      </div>

      <h2 className="mt-10 text-lg">Code agent tasks</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {tasks.map((t) => (
          <li key={t.id} className="rounded-lg border border-border p-3">
            <p className="text-fg-muted">{t.status}</p>
            <p className="line-clamp-2">{t.prompt}</p>
            {t.prUrl && (
              <a href={t.prUrl} className="text-accent" target="_blank" rel="noreferrer">
                Pull request
              </a>
            )}
            {t.error && <p className="text-danger">{t.error}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

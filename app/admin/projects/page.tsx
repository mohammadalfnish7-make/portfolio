import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createProject, updateProject } from "@/lib/services/content-service";

export default async function AdminProjectsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login");
  }

  const projects = await prisma.project.findMany({
    orderBy: { sortOrder: "asc" },
  });

  async function save(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user || s.user.role !== "ADMIN") throw new Error("Forbidden");

    const id = String(formData.get("id") || "");
    const payload = {
      title: String(formData.get("title")),
      slug: String(formData.get("slug")),
      summary: String(formData.get("summary")),
      problem: String(formData.get("problem")),
      approach: String(formData.get("approach")),
      outcome: String(formData.get("outcome")),
      tech: String(formData.get("tech") || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      published: formData.get("published") === "on",
      confidential: formData.get("confidential") === "on",
      featured: formData.get("featured") === "on",
      company: String(formData.get("company") || "") || null,
      period: String(formData.get("period") || "") || null,
      role: String(formData.get("role") || "") || null,
    };

    if (id) await updateProject(id, payload, s.user.id);
    else await createProject(payload, s.user.id);
    redirect("/admin/projects");
  }

  return (
    <div className="container-page py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Projects
        </h1>
        <Link href="/admin" className="text-sm text-accent">
          ← Admin
        </Link>
      </div>

      <ul className="mt-8 space-y-2 text-sm">
        {projects.map((p) => (
          <li key={p.id} className="rounded-lg border border-border px-4 py-3">
            {p.title}{" "}
            <span className="text-fg-muted">
              · {p.published ? "live" : "draft"} · {p.slug}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-xl">New / quick edit via create</h2>
      <form action={save} className="mt-4 grid max-w-xl gap-3">
        <input name="title" placeholder="Title" required className="min-h-11 rounded-md border border-border bg-bg px-3" />
        <input name="slug" placeholder="slug" required className="min-h-11 rounded-md border border-border bg-bg px-3" />
        <input name="company" placeholder="Company" className="min-h-11 rounded-md border border-border bg-bg px-3" />
        <input name="period" placeholder="Period" className="min-h-11 rounded-md border border-border bg-bg px-3" />
        <input name="role" placeholder="Role" className="min-h-11 rounded-md border border-border bg-bg px-3" />
        <textarea name="summary" placeholder="Summary" required className="rounded-md border border-border bg-bg px-3 py-2" />
        <textarea name="problem" placeholder="Problem" required className="rounded-md border border-border bg-bg px-3 py-2" />
        <textarea name="approach" placeholder="Approach" required className="rounded-md border border-border bg-bg px-3 py-2" />
        <textarea name="outcome" placeholder="Outcome" required className="rounded-md border border-border bg-bg px-3 py-2" />
        <input name="tech" placeholder="Tech (comma separated)" className="min-h-11 rounded-md border border-border bg-bg px-3" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" /> Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="confidential" defaultChecked /> Confidential
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" /> Featured
        </label>
        <button className="min-h-11 rounded-md bg-accent text-bg">Save project</button>
      </form>
    </div>
  );
}

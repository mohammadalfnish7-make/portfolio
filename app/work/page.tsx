import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedProjects } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Work",
  description: "Case studies in LLM gateways, document intelligence, and agentic automation.",
};

export default async function WorkPage() {
  const projects = await getPublishedProjects();

  return (
    <div className="container-page py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">Work</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">
        Case studies that double as course credibility — real systems, quantified where possible.
        Client work is confidential; diagrams and metrics carry the proof.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const metrics =
            (p.metrics as { label: string; value: string }[] | null) ?? [];
          return (
            <Link
              key={p.id}
              href={`/work/${p.slug}`}
              className="rounded-xl border border-border p-6 hover:border-accent"
            >
              <p className="text-xs text-fg-muted">
                {p.company} · {p.period}
                {p.confidential && " · Client work"}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl">
                {p.title}
              </h2>
              <p className="mt-3 text-sm text-fg-muted line-clamp-3">
                {p.summary}
              </p>
              {metrics[0] && (
                <p className="mt-4 text-accent text-sm">
                  {metrics[0].value} {metrics[0].label}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

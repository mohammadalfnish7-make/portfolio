import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjectBySlug, getPublishedProjects } from "@/lib/queries";
import { renderSafeMarkdown } from "@/lib/markdown";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const metrics =
    (project.metrics as { label: string; value: string }[] | null) ?? [];
  const [problem, approach, outcome] = await Promise.all([
    renderSafeMarkdown(project.problem),
    renderSafeMarkdown(project.approach),
    renderSafeMarkdown(project.outcome),
  ]);

  return (
    <article className="container-page py-16">
      <p className="text-sm text-fg-muted">
        {project.role} · {project.company} · {project.period}
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl">
        {project.title}
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-fg-muted">{project.summary}</p>

      {metrics.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-6">
          {metrics.map((m) => (
            <div key={m.label}>
              <p className="text-3xl font-semibold text-accent">{m.value}</p>
              <p className="text-sm text-fg-muted">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {project.confidential && (
        <p className="mt-6 text-sm text-warning">
          Client work — code not public. Architecture and outcomes below.
        </p>
      )}

      {project.diagramUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.diagramUrl}
          alt={`${project.title} architecture diagram`}
          className="mt-10 w-full max-w-3xl rounded-xl border border-border bg-bg-elevated"
        />
      )}

      <section className="prose-safe mt-12 max-w-3xl">
        <h2>Problem</h2>
        <div dangerouslySetInnerHTML={{ __html: problem }} />
        <h2>Approach</h2>
        <div dangerouslySetInnerHTML={{ __html: approach }} />
        <h2>Outcome</h2>
        <div dangerouslySetInnerHTML={{ __html: outcome }} />
      </section>

      <ul className="mt-10 flex flex-wrap gap-2">
        {project.tech.map((t) => (
          <li
            key={t}
            className="rounded-md border border-border px-3 py-1 text-sm text-fg-muted"
          >
            {t}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        {project.demoUrl && (
          <a
            href={project.demoUrl}
            className="text-accent"
            target="_blank"
            rel="noreferrer"
            data-track={`demo-${project.slug}`}
          >
            Live demo
          </a>
        )}
        {project.repoUrl && (
          <a
            href={project.repoUrl}
            className="text-accent"
            target="_blank"
            rel="noreferrer"
            data-track={`repo-${project.slug}`}
          >
            Source
          </a>
        )}
      </div>
    </article>
  );
}

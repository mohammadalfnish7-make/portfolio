import Link from "next/link";
import {
  getPublishedCourses,
  getPublishedProjects,
  getApprovedReviews,
  getSiteContent,
} from "@/lib/queries";

export default async function HomePage() {
  const [heroRow, projects, courses, reviews] = await Promise.all([
    getSiteContent("hero"),
    getPublishedProjects(),
    getPublishedCourses(),
    getApprovedReviews(),
  ]);

  const hero = (heroRow?.value ?? {}) as {
    name?: string;
    title?: string;
    tagline?: string;
    location?: string;
    ctaPrimary?: { label: string; href: string };
    ctaSecondary?: { label: string; href: string };
  };

  return (
    <>
      <section className="container-page flex min-h-[calc(100dvh-4rem)] flex-col justify-center py-16">
        <p className="text-sm uppercase tracking-[0.2em] text-accent">
          {hero.location ?? "Dubai, UAE"}
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.5rem,8vw,5rem)] leading-[1.05] tracking-tight">
          {hero.name ?? "Mohammad Alfnish"}
        </h1>
        <p className="mt-3 text-xl text-fg-muted md:text-2xl">
          {hero.title ?? "AI Solutions Architect"}
        </p>
        <p className="mt-6 max-w-2xl text-lg text-fg-muted">
          {hero.tagline}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href={hero.ctaPrimary?.href ?? "/courses"}
            className="inline-flex min-h-11 items-center rounded-md bg-accent px-5 font-medium text-bg"
            data-track="home-cta-courses"
          >
            {hero.ctaPrimary?.label ?? "View courses"}
          </Link>
          <Link
            href={hero.ctaSecondary?.href ?? "/work"}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-5"
            data-track="home-cta-work"
          >
            {hero.ctaSecondary?.label ?? "See case studies"}
          </Link>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-3xl">
            Courses
          </h2>
          <Link href="/courses" className="text-sm text-accent">
            All courses
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const left = Math.max(c.capacity - c.seatsTaken, 0);
            return (
              <Link
                key={c.id}
                href={`/courses/${c.slug}`}
                className="rounded-xl border border-border bg-bg-elevated/50 p-6 transition hover:border-accent"
                data-track={`course-card-${c.slug}`}
              >
                <p className="text-xs uppercase tracking-wider text-fg-muted">
                  {c.level} · {c.format.replace("_", " ")}
                </p>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl">
                  {c.title}
                </h3>
                <p className="mt-3 text-sm text-fg-muted line-clamp-3">
                  {c.summary}
                </p>
                <p className="mt-4 text-sm">
                  {(c.priceMinor / 100).toLocaleString()} {c.currency}
                  <span className="text-fg-muted">
                    {" "}
                    · {left <= 5 ? `${left} seats left` : "Seats available"}
                  </span>
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-page py-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-3xl">
            Selected work
          </h2>
          <Link href="/work" className="text-sm text-accent">
            All case studies
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects
            .filter((p) => p.featured)
            .map((p) => {
              const metrics = (p.metrics as { label: string; value: string }[] | null) ?? [];
              return (
                <Link
                  key={p.id}
                  href={`/work/${p.slug}`}
                  className="rounded-xl border border-border p-6 transition hover:border-accent"
                  data-track={`project-card-${p.slug}`}
                >
                  <p className="text-xs text-fg-muted">
                    {p.company} · {p.period}
                  </p>
                  <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-sm text-fg-muted line-clamp-3">
                    {p.summary}
                  </p>
                  {metrics[0] && (
                    <p className="mt-4 text-accent">
                      <span className="text-2xl font-semibold">
                        {metrics[0].value}
                      </span>{" "}
                      <span className="text-sm text-fg-muted">
                        {metrics[0].label}
                      </span>
                    </p>
                  )}
                </Link>
              );
            })}
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="container-page py-20">
          <h2 className="font-[family-name:var(--font-display)] text-3xl">
            Student voices
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <blockquote
                key={r.id}
                className="rounded-xl border border-border p-6"
              >
                <p className="text-sm text-fg-muted">“{r.body.slice(0, 180)}”</p>
                <footer className="mt-4 text-sm">
                  {r.authorName}
                  {r.verifiedStudent && (
                    <span className="ml-2 text-xs text-success">
                      Verified student
                    </span>
                  )}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

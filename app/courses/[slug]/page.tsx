import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCourseBySlug, getPublishedCourses } from "@/lib/queries";
import { renderSafeMarkdown } from "@/lib/markdown";
import { RegistrationForm } from "@/components/registration-form";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const courses = await getPublishedCourses();
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return {};
  return { title: course.title, description: course.summary };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const left = Math.max(course.capacity - course.seatsTaken, 0);
  const descriptionHtml = await renderSafeMarkdown(course.description);
  const syllabus = (course.syllabus as { title: string; hours?: number }[]) ?? [];

  const courseLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary,
    provider: {
      "@type": "Person",
      name: "Mohammad Alfnish",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: course.format.toLowerCase(),
      location: course.location,
      startDate: course.startDate?.toISOString(),
      endDate: course.endDate?.toISOString(),
    },
    offers: {
      "@type": "Offer",
      price: (course.priceMinor / 100).toFixed(2),
      priceCurrency: course.currency,
      availability:
        left > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
    },
  };

  return (
    <div className="container-page py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseLd) }}
      />
      <p className="text-sm uppercase tracking-wider text-fg-muted">
        {course.level} · {course.format.replace("_", " ")} · {course.language}
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl md:text-5xl">
        {course.title}
      </h1>
      {course.subtitle && (
        <p className="mt-3 text-xl text-fg-muted">{course.subtitle}</p>
      )}
      <p className="mt-6 max-w-3xl text-fg-muted">{course.summary}</p>

      <div className="mt-8 flex flex-wrap gap-6 text-sm">
        <p>
          <span className="text-2xl font-semibold text-accent">
            {(course.priceMinor / 100).toLocaleString()}
          </span>{" "}
          {course.currency}
        </p>
        <p className="self-end text-fg-muted">
          {left <= 5 ? `${left} seats left` : "Seats available"}
          {course.schedule ? ` · ${course.schedule}` : ""}
        </p>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div
            className="prose-safe max-w-3xl"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />

          <h2 className="mt-10 font-[family-name:var(--font-display)] text-2xl">
            Outcomes
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-fg-muted">
            {course.outcomes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>

          <h2 className="mt-10 font-[family-name:var(--font-display)] text-2xl">
            Syllabus
          </h2>
          <ol className="mt-4 space-y-3">
            {syllabus.map((m, i) => (
              <li
                key={m.title}
                className="rounded-lg border border-border px-4 py-3"
              >
                <span className="text-fg-muted">{i + 1}. </span>
                {m.title}
                {m.hours ? (
                  <span className="text-fg-muted"> · {m.hours}h</span>
                ) : null}
              </li>
            ))}
          </ol>

          {course.reviews.length > 0 && (
            <>
              <h2 className="mt-10 font-[family-name:var(--font-display)] text-2xl">
                Reviews
              </h2>
              <div className="mt-4 space-y-4">
                {course.reviews.map((r) => (
                  <blockquote
                    key={r.id}
                    className="rounded-lg border border-border p-4"
                  >
                    <p className="text-sm text-fg-muted">{r.body}</p>
                    <footer className="mt-2 text-sm">
                      {r.authorName} · {r.rating}/5
                      {r.verifiedStudent && (
                        <span className="ml-2 text-xs text-success">
                          Verified
                        </span>
                      )}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start rounded-xl border border-border bg-bg-elevated/50 p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            Register
          </h2>
          <p className="mt-2 text-sm text-fg-muted">
            Prerequisites: {course.prerequisites.join("; ") || "None listed"}
          </p>
          <div className="mt-6">
            {course.status === "OPEN" || course.status === "FULL" ? (
              <RegistrationForm
                courseSlug={course.slug}
                courseTitle={course.title}
              />
            ) : (
              <p className="text-sm text-fg-muted">
                Registration is closed for this cohort.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

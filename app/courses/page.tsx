import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedCourses } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Instructor-led courses on agentic systems and production LLM architecture.",
};

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return (
    <div className="container-page py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">
        Courses
      </h1>
      <p className="mt-3 max-w-2xl text-fg-muted">
        Small cohorts. Manual payment confirmation. Seats are limited on purpose.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => {
          const left = Math.max(c.capacity - c.seatsTaken, 0);
          return (
            <Link
              key={c.id}
              href={`/courses/${c.slug}`}
              className="rounded-xl border border-border bg-bg-elevated/40 p-6 hover:border-accent"
            >
              <p className="text-xs uppercase tracking-wider text-fg-muted">
                {c.level} · {c.format.replace("_", " ")}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl">
                {c.title}
              </h2>
              {c.subtitle && (
                <p className="mt-2 text-sm text-fg-muted">{c.subtitle}</p>
              )}
              <p className="mt-4 text-sm">
                {(c.priceMinor / 100).toLocaleString()} {c.currency}
              </p>
              <p className="mt-1 text-sm text-fg-muted">
                {left <= 5 ? `${left} seats left` : "Seats available"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

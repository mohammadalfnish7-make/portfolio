import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Architecture",
  description:
    "How this course platform and agent-operated portfolio is designed.",
};

export default function ArchitecturePage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">
        Architecture
      </h1>
      <p className="mt-4 text-fg-muted">
        One Next.js 16 app is the full stack: React Server Components for pages,
        Server Actions for dashboard mutations, Route Handlers for agents and
        registration. Postgres holds courses, enrollments, content, and
        analytics. Coolify runs a standalone Docker image on your VPS.
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/diagrams/platform-overview.svg"
        alt="Platform overview diagram"
        className="mt-10 w-full rounded-xl border border-border bg-bg-elevated"
      />

      <h2 className="mt-12 font-[family-name:var(--font-display)] text-2xl">
        Two write paths
      </h2>
      <p className="mt-3 text-fg-muted">
        <code>content-service</code> owns projects and site copy.
        <code> enrollment-service</code> owns registrations, atomic seat
        confirmation, payments, and reviews. Agents may only call content tools
        — never enrollments or payments.
      </p>

      <h2 className="mt-10 font-[family-name:var(--font-display)] text-2xl">
        Seat safety
      </h2>
      <p className="mt-3 text-fg-muted">
        Confirmation is an atomic <code>UPDATE … WHERE seatsTaken &lt;
        capacity</code>. A Postgres CHECK constraint backs it, and a nightly
        job reconciles the denormalised counter.
      </p>

      <h2 className="mt-10 font-[family-name:var(--font-display)] text-2xl">
        Agents
      </h2>
      <p className="mt-3 text-fg-muted">
        Content agent: idempotent tool calls + approval gate for deletes. Code
        agent: Cursor SDK opens PRs only; humans merge after CI.
      </p>
    </div>
  );
}

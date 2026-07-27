import type { Metadata } from "next";
import { getSiteContent } from "@/lib/queries";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const row = await getSiteContent("about");
  const about = (row?.value ?? {}) as {
    summary?: string;
    mentoring?: string;
    email?: string;
    linkedin?: string;
    github?: string;
    location?: string;
  };

  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">About</h1>
      <p className="mt-6 text-lg text-fg-muted">{about.summary}</p>
      <p className="mt-4 text-fg-muted">{about.mentoring}</p>
      <p className="mt-8 text-sm text-fg-muted">{about.location}</p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <a href={`mailto:${about.email}`} className="text-accent">
          {about.email}
        </a>
        <a href={about.linkedin} className="text-accent" target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <a href={about.github} className="text-accent" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href="/resume/mohammad-alfnish.pdf" className="text-accent">
          Resume PDF
        </a>
      </div>
    </div>
  );
}

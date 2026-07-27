import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container-page py-16 max-w-xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl">
        Contact
      </h1>
      <p className="mt-4 text-fg-muted">
        No phone number is published on this site. Email or the form below —
        open to remote work and course inquiries.
      </p>
      <p className="mt-4">
        <a className="text-accent" href="mailto:mhhfnesh@gmail.com">
          mhhfnesh@gmail.com
        </a>
      </p>
      <form
        className="mt-10 grid gap-4"
        action="mailto:mhhfnesh@gmail.com"
        method="post"
        encType="text/plain"
      >
        <label className="grid gap-1 text-sm">
          Name
          <input
            name="name"
            required
            autoComplete="name"
            className="min-h-11 rounded-md border border-border bg-bg px-3"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="min-h-11 rounded-md border border-border bg-bg px-3"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Message
          <textarea
            name="message"
            required
            rows={5}
            className="rounded-md border border-border bg-bg px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="min-h-11 rounded-md bg-accent px-5 font-medium text-bg"
        >
          Send
        </button>
      </form>
    </div>
  );
}

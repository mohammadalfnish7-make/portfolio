"use client";

import { useState, useTransition } from "react";

export function RegistrationForm({
  courseSlug,
  courseTitle,
}: {
  courseSlug: string;
  courseTitle: string;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug,
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          source: "course-page",
          website: fd.get("website"),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Registration failed");
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-success/40 bg-bg-elevated p-6">
        <h3 className="font-[family-name:var(--font-display)] text-xl">
          Registration received
        </h3>
        <p className="mt-2 text-sm text-fg-muted">
          Thanks for registering for {courseTitle}. Check your email for a
          receipt — I will contact you shortly to arrange payment and confirm
          your seat.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <label className="grid gap-1 text-sm">
        Full name
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
          inputMode="email"
          className="min-h-11 rounded-md border border-border bg-bg px-3"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Phone (with country code)
        <input
          name="phone"
          required
          autoComplete="tel"
          inputMode="tel"
          placeholder="+971…"
          className="min-h-11 rounded-md border border-border bg-bg px-3"
        />
      </label>
      {/* honeypot */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-md bg-accent px-5 font-medium text-bg disabled:opacity-60"
        data-track={`register-submit-${courseSlug}`}
      >
        {pending ? "Submitting…" : "Register interest"}
      </button>
      <p className="text-xs text-fg-muted">
        Registration does not reserve a seat. Payment is arranged directly;
        confirmation consumes a seat.
      </p>
    </form>
  );
}

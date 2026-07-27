"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

export default function StudentReviewForm() {
  const sp = useSearchParams();
  const courseId = sp.get("courseId") ?? undefined;
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await fetch("/api/student/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          authorName: fd.get("authorName"),
          rating: Number(fd.get("rating")),
          body: fd.get("body"),
          website: fd.get("website"),
        }),
      });
      if (!res.ok) {
        setError("Could not submit review");
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="container-page py-16 max-w-lg">
        <p>Thanks — your review is pending moderation.</p>
      </div>
    );
  }

  return (
    <div className="container-page py-16 max-w-lg">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        Leave a review
      </h1>
      <form onSubmit={onSubmit} className="mt-8 grid gap-4">
        <label className="grid gap-1 text-sm">
          Display name
          <input
            name="authorName"
            required
            className="min-h-11 rounded-md border border-border bg-bg px-3"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Rating (1–5)
          <input
            name="rating"
            type="number"
            min={1}
            max={5}
            required
            className="min-h-11 rounded-md border border-border bg-bg px-3"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Review
          <textarea
            name="body"
            required
            rows={5}
            className="rounded-md border border-border bg-bg px-3 py-2"
          />
        </label>
        <input
          name="website"
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />
        {error && <p className="text-danger text-sm">{error}</p>}
        <button
          disabled={pending}
          className="min-h-11 rounded-md bg-accent text-bg"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

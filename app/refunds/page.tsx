import type { Metadata } from "next";

export const metadata: Metadata = { title: "Refunds" };

export default function RefundsPage() {
  return (
    <div className="container-page prose-safe max-w-3xl py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-fg">
        Refund and cancellation
      </h1>
      <p>
        Because payment is arranged manually, refunds are handled by direct
        contact.
      </p>
      <h2>Before confirmation</h2>
      <p>
        If you registered but have not paid or been confirmed, cancel by email
        with no charge.
      </p>
      <h2>After payment, before the start date</h2>
      <p>
        Full refund if you cancel at least 7 days before the published start
        date, unless otherwise agreed in writing for that cohort.
      </p>
      <h2>After the course starts</h2>
      <p>
        Refunds are discretionary and typically partial, based on sessions
        remaining and circumstances. Contact mhhfnesh@gmail.com.
      </p>
      <h2>Instructor cancellation</h2>
      <p>
        If a cohort is cancelled by the instructor, you receive a full refund or
        a seat in a later cohort — your choice.
      </p>
    </div>
  );
}

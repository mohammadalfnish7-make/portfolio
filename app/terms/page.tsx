import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="container-page prose-safe max-w-3xl py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-fg">
        Terms of use
      </h1>
      <p>
        By using this site or registering for a course you agree to these terms.
      </p>
      <h2>Courses</h2>
      <p>
        Registration expresses interest. A seat is confirmed only after payment
        is arranged and the instructor confirms enrollment. Course content and
        schedule may be updated with reasonable notice.
      </p>
      <h2>Accounts</h2>
      <p>
        You are responsible for keeping login credentials confidential. Do not
        share materials links beyond your personal use unless permitted.
      </p>
      <h2>Content</h2>
      <p>
        Case studies may describe confidential client work at a high level.
        Do not treat diagrams or descriptions as disclosure of proprietary code.
      </p>
      <h2>Liability</h2>
      <p>
        The site and courses are provided as-is. To the extent permitted by law,
        liability is limited to fees paid for the relevant course cohort.
      </p>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <div className="container-page prose-safe max-w-3xl py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-fg">
        Privacy policy
      </h1>
      <p>
        This site collects the minimum personal data needed to run courses and
        respond to inquiries.
      </p>
      <h2>What we collect</h2>
      <p>
        For course registration: name, email, and phone number. For student
        accounts: email and password hash. Analytics are cookieless hashed
        identifiers without storing raw IP addresses.
      </p>
      <h2>Why</h2>
      <p>
        To contact you about payment and seat confirmation, deliver course
        materials links, and improve the site. We do not sell your data.
      </p>
      <h2>Retention and deletion</h2>
      <p>
        You can request deletion of your account and enrollment records by
        emailing mhhfnesh@gmail.com or using the account deletion path in the
        student area once signed in. Backups may retain data for a limited
        recovery window.
      </p>
      <h2>Payments</h2>
      <p>
        Card data never touches this system. Payment is arranged directly
        outside the platform.
      </p>
      <h2>Contact</h2>
      <p>mhhfnesh@gmail.com · Dubai, UAE</p>
    </div>
  );
}

import { Fraunces, Sora } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { AnalyticsBeacon } from "@/components/analytics";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Sora({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Mohammad Alfnish · AI Solutions Architect",
    template: "%s · Mohammad Alfnish",
  },
  description:
    "AI Solutions Architect in Dubai. Courses on agentic systems, plus case studies in LLM gateways and document intelligence.",
  openGraph: {
    type: "website",
    locale: "en_AE",
    siteName: "Mohammad Alfnish",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Mohammad Alfnish",
    jobTitle: "AI Solutions Architect",
    email: "mhhfnesh@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressCountry: "AE",
    },
    sameAs: [
      "https://linkedin.com/in/mohammadalfnish",
      "https://github.com/mohammadalfnish",
    ],
    knowsAbout: [
      "LangGraph",
      "LLM gateways",
      "Document intelligence",
      "FastAPI",
      "Agentic systems",
    ],
  };

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
        />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <AnalyticsBeacon />
      </body>
    </html>
  );
}

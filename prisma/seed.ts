import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "mhhfnesh@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMeNow!123";

  const passwordHash = await hash(adminPassword, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Mohammad Alfnish",
      role: "ADMIN",
      passwordHash,
      emailVerifiedAt: new Date(),
    },
    update: {
      role: "ADMIN",
      passwordHash,
    },
  });

  await prisma.siteContent.upsert({
    where: { key: "hero" },
    create: {
      key: "hero",
      value: {
        name: "Mohammad Alfnish",
        title: "AI Solutions Architect",
        tagline:
          "I build agentic systems, document intelligence pipelines, and courses that teach you to do the same.",
        ctaPrimary: { label: "View courses", href: "/courses" },
        ctaSecondary: { label: "See case studies", href: "/work" },
        location: "Dubai, UAE · open to remote",
      },
    },
    update: {},
  });

  await prisma.siteContent.upsert({
    where: { key: "about" },
    create: {
      key: "about",
      value: {
        summary:
          "AI Solutions Architect with 3+ years building end-to-end document intelligence pipelines: ingestion, OCR/LLM extraction, validation, risk detection, and automated alerting on async worker-pool architectures. Proven at designing LLM gateways and LangGraph agentic workflows — including a 95% reduction in LLM inference costs.",
        mentoring:
          "Academic volunteer at Damascus University mentoring ~180 Computer Science students annually.",
        email: "mhhfnesh@gmail.com",
        linkedin: "https://linkedin.com/in/mohammadalfnish",
        github: "https://github.com/mohammadalfnish",
        location: "Dubai, UAE",
      },
    },
    update: {},
  });

  await prisma.siteContent.upsert({
    where: { key: "contact" },
    create: {
      key: "contact",
      value: {
        email: "mhhfnesh@gmail.com",
        note: "No phone published. Use the form or email — open to remote work and course inquiries.",
      },
    },
    update: {},
  });

  const projects = [
    {
      title: "Async LLM Gateway",
      slug: "async-llm-gateway",
      role: "AI Engineer",
      company: "maids.cc",
      period: "Jan 2025 – Sep 2025",
      summary:
        "High-throughput multi-provider LLM gateway with Redis semantic caching and cost/latency monitoring.",
      problem:
        "Inference spend and latency spiked as multiple product teams called different LLM providers without shared caching, retries, or metering.",
      approach:
        "Designed a FastAPI + Docker gateway with a provider factory, RabbitMQ workers, Redis semantic cache, retry/timeout policies, and real-time cost tracking.",
      outcome:
        "Cut LLM inference cost by ~95% while keeping multi-provider orchestration reliable under load.",
      tech: [
        "Python",
        "FastAPI",
        "Docker",
        "Redis",
        "RabbitMQ",
        "LangGraph",
      ],
      metrics: [
        { label: "LLM cost reduction", value: "95%" },
        { label: "Architecture", value: "Async workers" },
      ],
      confidential: true,
      featured: true,
      sortOrder: 1,
      published: true,
      diagramUrl: "/diagrams/llm-gateway.svg",
    },
    {
      title: "Document Intelligence & Risk Automation",
      slug: "document-intelligence-hito",
      role: "Head of Tech / Technical Partner",
      company: "HITO",
      period: "Feb 2026 – Present",
      summary:
        "Patient and document intake pipeline with OCR/LLM extraction, validation, alerting, and Stripe billing.",
      problem:
        "Manual document handling slowed patient workflows and introduced inconsistent data into downstream systems.",
      approach:
        "Architected ingestion → OCR/LLM extraction → Pydantic validation → risk flagging on Celery/RabbitMQ pools, with Stripe for automated billing.",
      outcome:
        "End-to-end automated document and payment flow with audit-ready structured data.",
      tech: [
        "FastAPI",
        "Celery",
        "RabbitMQ",
        "PostgreSQL",
        "Stripe",
        "OCR",
      ],
      metrics: [
        { label: "Pipeline", value: "Ingest→Alert" },
        { label: "Billing", value: "Stripe" },
      ],
      confidential: true,
      featured: true,
      sortOrder: 2,
      published: true,
      diagramUrl: "/diagrams/document-intelligence.svg",
    },
    {
      title: "Agentic Workflow Automation",
      slug: "agentic-whatsapp-erpnext",
      role: "AI Manager",
      company: "shazmlc",
      period: "Oct 2025 – Feb 2026",
      summary:
        "WhatsApp Business bots unified with Chatwoot and ERPNext through n8n and webhooks.",
      problem:
        "Sales intake, identity verification, and support triage were fragmented across chat and ERP systems.",
      approach:
        "Built WhatsApp bots (sales, resolver, identification) and wired Chatwoot + ERPNext via n8n/webhooks with Traefik HA deployment.",
      outcome:
        "Unified intake-to-system-of-record automation with less manual triage at the entry point.",
      tech: ["WhatsApp API", "n8n", "Chatwoot", "ERPNext", "Traefik"],
      metrics: [
        { label: "Integration", value: "End-to-end" },
        { label: "Channel", value: "WhatsApp" },
      ],
      confidential: true,
      featured: true,
      sortOrder: 3,
      published: true,
      diagramUrl: "/diagrams/agentic-workflows.svg",
    },
  ];

  for (const p of projects) {
    await prisma.project.upsert({
      where: { slug: p.slug },
      create: p,
      update: p,
    });
  }

  // Remaining three as draft placeholders (M4)
  const drafts = [
    {
      slug: "resume-screening-pipeline",
      title: "Resume Screening Pipeline",
      company: "shazmlc",
      period: "Oct 2025 – Feb 2026",
      summary: "OCR resume parsing feeding an LLM scoring engine.",
    },
    {
      slug: "waste-demand-forecasting",
      title: "Waste Demand Forecasting",
      company: "Freelance · Kuwait",
      period: "Aug 2024 – Oct 2024",
      summary: "SARIMA / XGBoost / LSTM forecasting for municipal fleets.",
    },
    {
      slug: "this-platform",
      title: "Course Platform & Agent Portfolio",
      company: "Personal",
      period: "2026",
      summary:
        "Self-hosted Next.js course platform with agent-operated content and first-party analytics.",
    },
  ];

  for (const [i, d] of drafts.entries()) {
    await prisma.project.upsert({
      where: { slug: d.slug },
      create: {
        ...d,
        role: "Builder",
        problem: "TBD",
        approach: "TBD",
        outcome: "TBD",
        tech: [],
        confidential: d.slug !== "this-platform",
        featured: false,
        sortOrder: 4 + i,
        published: d.slug === "this-platform",
        demoUrl:
          d.slug === "this-platform"
            ? process.env.NEXT_PUBLIC_SITE_URL ?? null
            : null,
        repoUrl:
          d.slug === "this-platform"
            ? process.env.REPO_URL ?? null
            : null,
      },
      update: {},
    });
  }

  await prisma.course.upsert({
    where: { slug: "agentic-systems-intensive" },
    create: {
      slug: "agentic-systems-intensive",
      title: "Agentic Systems Intensive",
      subtitle: "Build production LLM gateways, tools, and approval gates",
      summary:
        "A hands-on instructor-led course on designing agentic backends you can actually ship — the same patterns behind a 95% LLM cost cut and this platform.",
      description: `## What you will build
Tool-calling agents, idempotent write paths, approval gates, and an async orchestration layer.

## How it runs
Live sessions online. Materials as Drive/Notion links. Payment arranged directly after registration.`,
      outcomes: [
        "Design a multi-provider LLM gateway with caching and metering",
        "Implement tool calling with idempotency and human approval",
        "Ship a small agent-backed product with audit logs",
      ],
      prerequisites: [
        "Comfortable with Python or TypeScript",
        "Basic HTTP/API knowledge",
      ],
      syllabus: [
        { title: "LLM gateway patterns", hours: 4 },
        { title: "Tool calling & guardrails", hours: 4 },
        { title: "Orchestration & workers", hours: 4 },
        { title: "Ship a mini agent product", hours: 4 },
      ],
      level: "Intermediate",
      language: "en",
      format: "ONLINE",
      location: "Online · Dubai timezone",
      startDate: new Date("2026-09-15T16:00:00.000Z"),
      endDate: new Date("2026-10-06T18:00:00.000Z"),
      schedule: "Mon & Wed 20:00–22:00 GST",
      totalHours: 16,
      priceMinor: 250000,
      currency: "AED",
      capacity: 20,
      seatsTaken: 0,
      status: "OPEN",
      published: true,
      materialsUrl: null,
      sortOrder: 1,
    },
    update: {
      published: true,
      status: "OPEN",
    },
  });

  console.log("Seed complete.");
  console.log(`Admin: ${adminEmail}`);
  console.log("Change ADMIN_PASSWORD after first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { z } from "zod";

const httpUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("http://") || u.startsWith("https://"), {
    message: "URL must be http or https",
  });

export const projectMetricSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(40),
});

export const projectInputSchema = z
  .object({
    title: z.string().min(2).max(160),
    slug: z
      .string()
      .min(2)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    role: z.string().max(120).optional().nullable(),
    company: z.string().max(120).optional().nullable(),
    period: z.string().max(80).optional().nullable(),
    summary: z.string().min(10).max(2000),
    problem: z.string().min(10),
    approach: z.string().min(10),
    outcome: z.string().min(10),
    tech: z.array(z.string().min(1).max(60)).max(30),
    metrics: z.array(projectMetricSchema).max(8).optional().nullable(),
    demoUrl: httpUrl.optional().nullable(),
    repoUrl: httpUrl.optional().nullable(),
    diagramUrl: z.string().max(300).optional().nullable(),
    confidential: z.boolean().optional(),
    featured: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
    published: z.boolean().optional(),
  })
  .strict();

export const siteContentSchema = z
  .object({
    key: z.string().min(1).max(80),
    value: z.unknown(),
  })
  .strict();

export const registrationSchema = z
  .object({
    courseSlug: z.string().min(1),
    name: z.string().min(2).max(120),
    email: z.string().email().max(200),
    phone: z.string().min(8).max(30),
    source: z.string().max(80).optional(),
    website: z.string().max(0).optional(), // honeypot
  })
  .strict();

export const enrollmentStatusSchema = z.enum([
  "REGISTERED",
  "CONTACTED",
  "CONFIRMED",
  "WAITLISTED",
  "CANCELLED",
  "NO_RESPONSE",
]);

export const paymentInputSchema = z
  .object({
    enrollmentId: z.string().min(1),
    method: z.enum(["bank_transfer", "cash", "other"]),
    amountMinor: z.number().int().positive(),
    currency: z.string().length(3),
    reference: z.string().max(120).optional(),
    receivedAt: z.coerce.date(),
  })
  .strict();

export const reviewInputSchema = z
  .object({
    courseId: z.string().optional(),
    authorName: z.string().min(2).max(120),
    rating: z.number().int().min(1).max(5),
    body: z.string().min(10).max(4000),
    website: z.string().max(0).optional(),
  })
  .strict();

export const trackEventSchema = z
  .object({
    path: z.string().min(1).max(500),
    referrer: z.string().max(1000).optional(),
    visitorId: z.string().min(8).max(128),
    sessionId: z.string().min(8).max(128),
    durationMs: z.number().int().min(0).max(3_600_000).optional(),
    deviceType: z.string().max(40).optional(),
    viewportBucket: z.string().max(40).optional(),
    browser: z.string().max(80).optional(),
    events: z
      .array(
        z.object({
          name: z.enum([
            "click",
            "outbound",
            "scroll_depth",
            "project_view",
            "course_view",
          ]),
          path: z.string().min(1).max(500),
          target: z.string().max(300).optional(),
          meta: z.record(z.unknown()).optional(),
        }),
      )
      .max(50)
      .optional(),
  })
  .strict();

export type ProjectInput = z.infer<typeof projectInputSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;

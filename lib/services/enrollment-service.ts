import "server-only";
import { Prisma, EnrollmentStatus } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import {
  paymentInputSchema,
  registrationSchema,
  reviewInputSchema,
} from "@/lib/validation";
import {
  sendAdminRegistrationAlert,
  sendRegistrationReceipt,
  sendReviewApproved,
} from "@/lib/email";

async function logChange(input: {
  actor: string;
  action: string;
  entity: string;
  entityId?: string;
  args?: unknown;
}) {
  await prisma.changeLog.create({
    data: {
      actor: input.actor,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      args: input.args as Prisma.InputJsonValue | undefined,
      publicVisible: false,
    },
  });
}

async function invalidateCourse(slug: string) {
  revalidateTag("courses");
  revalidateTag(`course:${slug}`);
}

export async function registerForCourse(input: unknown) {
  const data = registrationSchema.parse(input);
  if (data.website) {
    return { ok: true as const, honeypot: true };
  }

  const course = await prisma.course.findFirst({
    where: { slug: data.courseSlug, published: true },
  });
  if (!course) {
    throw new Error("Course not found");
  }
  if (course.status === "CANCELLED" || course.status === "COMPLETED") {
    throw new Error("Course is not open for registration");
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      courseId: course.id,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      status: "REGISTERED",
      agreedPriceMinor: course.priceMinor,
      currency: course.currency,
      source: data.source,
    },
  });

  // Link to existing student account if email matches
  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (user) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { userId: user.id },
    });
  }

  await logChange({
    actor: `registration:${data.email}`,
    action: "register",
    entity: "Enrollment",
    entityId: enrollment.id,
    args: { courseId: course.id, email: data.email },
  });

  // Fire-and-forget email (do not block registration response)
  void sendRegistrationReceipt({
    to: data.email,
    name: data.name,
    courseTitle: course.title,
  });
  void sendAdminRegistrationAlert({
    name: data.name,
    email: data.email,
    phone: data.phone,
    courseTitle: course.title,
    enrollmentId: enrollment.id,
  });

  return { ok: true as const, enrollmentId: enrollment.id };
}

/**
 * Atomic seat confirmation. Returns false if course is full.
 * Uses updateMany with seatsTaken < capacity so concurrent confirmations cannot oversell.
 */
export async function confirmEnrollment(
  enrollmentId: string,
  actor: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const enrollment = await prisma.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    include: { course: true },
  });

  if (enrollment.status === "CONFIRMED") {
    return { ok: true };
  }
  if (
    enrollment.status === "CANCELLED" ||
    enrollment.status === "NO_RESPONSE"
  ) {
    return { ok: false, reason: "Enrollment is closed" };
  }

  const result = await prisma.$transaction(async (tx) => {
    const seat = await tx.course.updateMany({
      where: {
        id: enrollment.courseId,
        seatsTaken: { lt: enrollment.course.capacity },
      },
      data: { seatsTaken: { increment: 1 } },
    });
    if (seat.count === 0) {
      return { ok: false as const, reason: "Course is full" };
    }

    await tx.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    const course = await tx.course.findUniqueOrThrow({
      where: { id: enrollment.courseId },
    });
    if (course.seatsTaken >= course.capacity && course.status === "OPEN") {
      await tx.course.update({
        where: { id: course.id },
        data: { status: "FULL" },
      });
    }

    return { ok: true as const };
  });

  if (!result.ok) {
    return result;
  }

  await logChange({
    actor,
    action: "confirm_enrollment",
    entity: "Enrollment",
    entityId: enrollmentId,
  });
  await invalidateCourse(enrollment.course.slug);
  return { ok: true };
}

export async function setEnrollmentStatus(
  enrollmentId: string,
  status: EnrollmentStatus,
  actor: string,
  notes?: string,
) {
  if (status === "CONFIRMED") {
    return confirmEnrollment(enrollmentId, actor);
  }

  const enrollment = await prisma.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    include: { course: true },
  });

  const wasConfirmed = enrollment.status === "CONFIRMED";

  await prisma.$transaction(async (tx) => {
    await tx.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status,
        adminNotes: notes ?? enrollment.adminNotes,
        confirmedAt: status === "CONFIRMED" ? new Date() : enrollment.confirmedAt,
      },
    });

    if (wasConfirmed && status !== "CONFIRMED") {
      await tx.course.updateMany({
        where: { id: enrollment.courseId, seatsTaken: { gt: 0 } },
        data: { seatsTaken: { decrement: 1 } },
      });
      await tx.course.updateMany({
        where: { id: enrollment.courseId, status: "FULL" },
        data: { status: "OPEN" },
      });
    }
  });

  await logChange({
    actor,
    action: "set_enrollment_status",
    entity: "Enrollment",
    entityId: enrollmentId,
    args: { status, notes },
  });
  await invalidateCourse(enrollment.course.slug);
  return { ok: true as const };
}

export async function recordPayment(input: unknown, actorUserId: string) {
  const data = paymentInputSchema.parse(input);
  const payment = await prisma.paymentRecord.create({
    data: {
      enrollmentId: data.enrollmentId,
      method: data.method,
      amountMinor: data.amountMinor,
      currency: data.currency,
      reference: data.reference,
      receivedAt: data.receivedAt,
      recordedByUserId: actorUserId,
    },
  });
  await logChange({
    actor: actorUserId,
    action: "record_payment",
    entity: "PaymentRecord",
    entityId: payment.id,
    args: data,
  });
  return payment;
}

export async function submitReview(
  input: unknown,
  userId?: string,
) {
  const data = reviewInputSchema.parse(input);
  if (data.website) {
    return { ok: true as const, honeypot: true };
  }

  let verifiedStudent = false;
  if (userId && data.courseId) {
    const confirmed = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: data.courseId,
        status: "CONFIRMED",
      },
    });
    verifiedStudent = Boolean(confirmed);
  }

  const review = await prisma.review.create({
    data: {
      courseId: data.courseId,
      userId,
      authorName: data.authorName,
      rating: data.rating,
      body: data.body,
      status: "PENDING",
      verifiedStudent,
    },
  });

  await logChange({
    actor: userId ?? `anon:${data.authorName}`,
    action: "submit_review",
    entity: "Review",
    entityId: review.id,
  });

  return { ok: true as const, reviewId: review.id };
}

export async function moderateReview(
  reviewId: string,
  approve: boolean,
  moderatorId: string,
) {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: {
      status: approve ? "APPROVED" : "REJECTED",
      approvedAt: approve ? new Date() : null,
      moderatedByUserId: moderatorId,
    },
    include: { course: true, user: true },
  });

  await logChange({
    actor: moderatorId,
    action: approve ? "approve_review" : "reject_review",
    entity: "Review",
    entityId: reviewId,
  });

  revalidateTag("reviews");

  if (approve && review.user?.email) {
    void sendReviewApproved({
      to: review.user.email,
      authorName: review.authorName,
    });
  }

  return review;
}

export async function reconcileSeatCounts() {
  const courses = await prisma.course.findMany({ select: { id: true } });
  const drifts: string[] = [];

  for (const course of courses) {
    const confirmed = await prisma.enrollment.count({
      where: { courseId: course.id, status: "CONFIRMED" },
    });
    const current = await prisma.course.findUniqueOrThrow({
      where: { id: course.id },
    });
    if (current.seatsTaken !== confirmed) {
      drifts.push(course.id);
      await prisma.course.update({
        where: { id: course.id },
        data: { seatsTaken: confirmed },
      });
    }
  }

  return { checked: courses.length, drifts };
}

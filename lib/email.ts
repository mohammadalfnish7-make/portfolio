import "server-only";

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? "noreply@example.com";
const ADMIN = process.env.ADMIN_EMAIL ?? "mhhfnesh@gmail.com";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function sendEmail(payload: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_KEY) {
    console.info("[email:dev]", payload.subject, "→", payload.to);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!res.ok) {
    console.error("email_send_failed", await res.text());
  }
}

export async function sendRegistrationReceipt(input: {
  to: string;
  name: string;
  courseTitle: string;
}) {
  await sendEmail({
    to: input.to,
    subject: `Registration received — ${input.courseTitle}`,
    html: `<p>Hi ${input.name},</p>
<p>Thanks for registering for <strong>${input.courseTitle}</strong>.</p>
<p>I will contact you shortly to arrange payment and confirm your seat.</p>
<p>— Mohammad Alfnish</p>`,
  });
}

export async function sendAdminRegistrationAlert(input: {
  name: string;
  email: string;
  phone: string;
  courseTitle: string;
  enrollmentId: string;
}) {
  const wa = input.phone.replace(/[^\d+]/g, "");
  await sendEmail({
    to: ADMIN,
    subject: `New registration: ${input.courseTitle}`,
    html: `<p><strong>${input.name}</strong> registered for ${input.courseTitle}.</p>
<p>Email: ${input.email}<br/>Phone: ${input.phone}</p>
<p><a href="https://wa.me/${wa.replace("+", "")}">WhatsApp</a> ·
<a href="${SITE}/admin/enrollments/${input.enrollmentId}">Open in dashboard</a></p>`,
  });
}

export async function sendReviewApproved(input: {
  to: string;
  authorName: string;
}) {
  await sendEmail({
    to: input.to,
    subject: "Your review is live",
    html: `<p>Hi ${input.authorName},</p><p>Your review has been approved and is now public. Thank you.</p>`,
  });
}

export async function sendEmailVerification(input: {
  to: string;
  token: string;
}) {
  const url = `${SITE}/auth/verify?token=${encodeURIComponent(input.token)}`;
  await sendEmail({
    to: input.to,
    subject: "Verify your email",
    html: `<p>Verify your account:</p><p><a href="${url}">${url}</a></p>`,
  });
}

export async function sendPasswordReset(input: {
  to: string;
  token: string;
}) {
  const url = `${SITE}/auth/reset?token=${encodeURIComponent(input.token)}`;
  await sendEmail({
    to: input.to,
    subject: "Reset your password",
    html: `<p>Reset your password (expires in 1 hour):</p><p><a href="${url}">${url}</a></p>`,
  });
}

export async function sendCourseReminder(input: {
  to: string;
  name: string;
  courseTitle: string;
  startDate: string;
}) {
  await sendEmail({
    to: input.to,
    subject: `Reminder: ${input.courseTitle} starts soon`,
    html: `<p>Hi ${input.name},</p>
<p>${input.courseTitle} starts on ${input.startDate}. Materials and join links will be shared before then.</p>`,
  });
}

export async function sendStaleRegistrationNudge(input: {
  enrollmentId: string;
  name: string;
  courseTitle: string;
}) {
  await sendEmail({
    to: ADMIN,
    subject: `Uncontacted registration (3+ days): ${input.name}`,
    html: `<p>${input.name} registered for ${input.courseTitle} and is still REGISTERED.</p>
<p><a href="${SITE}/admin/enrollments/${input.enrollmentId}">Open roster</a></p>`,
  });
}

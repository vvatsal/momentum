import { Resend } from "resend";
import { getAppUrl, getResendConfig } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublishEmailResult = {
  sent: number;
  failed: number;
  skipped: boolean;
  message?: string;
};

async function logEmail(
  testId: string,
  recipient: string,
  subject: string,
  status: "sent" | "failed" | "skipped",
  resendId?: string | null,
  errorMessage?: string | null
) {
  const admin = createAdminClient();
  await admin.from("email_notifications_log").insert({
    test_id: testId,
    recipient_email: recipient,
    subject,
    status,
    resend_id: resendId ?? null,
    error_message: errorMessage ?? null,
  });
}

export async function notifyStudentsTestPublished(
  testId: string,
  testTitle: string
): Promise<PublishEmailResult> {
  const resendConfig = getResendConfig();
  const admin = createAdminClient();

  const { data: students, error } = await admin
    .from("profiles")
    .select("email")
    .eq("role", "student");

  if (error || !students?.length) {
    return {
      sent: 0,
      failed: 0,
      skipped: true,
      message: error?.message ?? "No students to notify",
    };
  }

  const appUrl = getAppUrl();
  const testUrl = `${appUrl}/tests/${testId}`;
  const subject = `New test available: ${testTitle}`;

  if (!resendConfig) {
    for (const s of students) {
      await logEmail(testId, s.email, subject, "skipped", null, "Resend not configured");
    }
    return {
      sent: 0,
      failed: 0,
      skipped: true,
      message: "Resend not configured — add RESEND_API_KEY and RESEND_FROM_EMAIL",
    };
  }

  const resend = new Resend(resendConfig.apiKey);
  let sent = 0;
  let failed = 0;

  for (const s of students) {
    try {
      const { data, error: sendError } = await resend.emails.send({
        from: resendConfig.fromEmail,
        to: s.email,
        subject,
        html: `
          <p>A new test has been published on Momentum.</p>
          <p><strong>${escapeHtml(testTitle)}</strong></p>
          <p><a href="${testUrl}">Open test</a></p>
          <p>Or copy this link: ${testUrl}</p>
        `,
      });

      if (sendError) {
        failed += 1;
        await logEmail(testId, s.email, subject, "failed", null, sendError.message);
      } else {
        sent += 1;
        await logEmail(testId, s.email, subject, "sent", data?.id ?? null);
      }
    } catch (e) {
      failed += 1;
      const msg = e instanceof Error ? e.message : "Send failed";
      await logEmail(testId, s.email, subject, "failed", null, msg);
    }
  }

  return { sent, failed, skipped: false };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

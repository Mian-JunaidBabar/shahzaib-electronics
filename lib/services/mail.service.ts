import { ReactElement } from "react";
/**
 * Mail Service
 *
 * Central email service using Resend for transactional emails.
 * This is the single point of contact for all email-sending operations.
 */
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender configuration
// NOTE: Resend requires either a verified domain OR use their test domain
// To send to verified emails: verify your domain at https://resend.com/domains
// For development: noreply@resend.dev (Resend's test domain - works for all recipients)
const fromEmail =
  process.env.EMAIL_FROM ||
  (process.env.NODE_ENV === "production"
    ? "Shahzaib Electronics <noreply@shahzaibelectronics.pk>"
    : "noreply@resend.dev");

// Admin email for notifications
export const adminEmail =
  process.env.ADMIN_EMAIL || "owner.shahzaib.autos@gmail.com";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
}

/**
 * Send an email using Resend
 *
 * This function handles errors gracefully - email is treated as a
 * non-critical side-effect, so failures are logged but not thrown.
 */
export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
}: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      replyTo,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message };
    }

    console.log(`Email sent to ${to} with subject "${subject}"`, data?.id);
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    // Do not throw errors - email is a non-critical side-effect.
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send email without awaiting (fire-and-forget for non-critical emails)
 */
export function sendEmailAsync(options: SendEmailOptions): void {
  sendEmail(options).catch((error) => {
    console.error("Async email send failed:", error);
  });
}

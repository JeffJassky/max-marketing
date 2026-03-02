import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@maxedmarketing.com";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  if (!apiKey) {
    console.warn("SENDGRID_API_KEY not set — password reset email not sent.");
    console.log(`[DEV] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  const msg = {
    to,
    from: fromEmail,
    subject: "Reset Your MAXED Marketing Password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background: #22c55e; color: #0f172a; font-weight: bold; font-size: 24px; width: 48px; height: 48px; line-height: 48px; border-radius: 12px;">M</div>
          <h1 style="margin: 16px 0 0; color: #0f172a; font-size: 24px;">MAXED Marketing</h1>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
          <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 20px;">Password Reset Request</h2>
          <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">
            We received a request to reset your password. Click the button below to set a new password. This link expires in 1 hour.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error("Failed to send password reset email:", err);
  }
}

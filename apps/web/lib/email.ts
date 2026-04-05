import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
const resend =
  resendApiKey && !resendApiKey.startsWith("re_local_")
    ? new Resend(resendApiKey)
    : null

const fromEmail = process.env.EMAIL_FROM || "Tally ERP <noreply@example.com>"

async function sendEmailOrLog(input: {
  to: string
  subject: string
  html: string
}) {
  if (!resend) {
    console.log(`[email] Skipping email send in local mode: ${input.subject} -> ${input.to}`)
    return
  }

  await resend.emails.send({
    from: fromEmail,
    to: input.to,
    subject: input.subject,
    html: input.html,
  })
}

export async function sendVerificationEmail(email: string, url: string) {
  await sendEmailOrLog({
    to: email,
    subject: "Verify your email address",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify your email address</h2>
        <p>Click the link below to verify your email address and activate your account.</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 6px;">
          Verify Email
        </a>
        <p style="margin-top: 16px; color: #64748b; font-size: 14px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, url: string) {
  await sendEmailOrLog({
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password.</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 6px;">
          Reset Password
        </a>
        <p style="margin-top: 16px; color: #64748b; font-size: 14px;">
          If you didn't request a password reset, you can safely ignore this email.
          This link will expire in 1 hour.
        </p>
      </div>
    `,
  })
}

export async function sendCompanyInvitationEmail(
  email: string,
  companyName: string,
  inviterName: string,
  url: string
) {
  await sendEmailOrLog({
    to: email,
    subject: `You've been invited to join ${companyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited to ${companyName}</h2>
        <p>${inviterName} has invited you to join <strong>${companyName}</strong> on Tally ERP.</p>
        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 6px;">
          Accept Invitation
        </a>
        <p style="margin-top: 16px; color: #64748b; font-size: 14px;">
          If you weren't expecting this invitation, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}

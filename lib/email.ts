import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "OneBank SA <hello@onebank.co.za>";

// ─── Brand constants ────────────────────────────────────────────────────────
const BRAND = {
  green: "#1B4332",
  gold: "#D4A017",
  greenLight: "#2D6A4F",
  bg: "#F4F6F8",
  textDark: "#1A202C",
  textMuted: "#718096",
  border: "#E2E8F0",
  font: "Arial, Helvetica, sans-serif",
};

// ─── Shared layout helpers ───────────────────────────────────────────────────

function header(): string {
  return `
    <tr>
      <td align="center" style="background:${BRAND.green};padding:28px 40px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="
              width:44px;height:44px;
              background:${BRAND.gold};
              border-radius:50%;
              text-align:center;
              vertical-align:middle;
              font-family:${BRAND.font};
              font-size:16px;
              font-weight:bold;
              color:${BRAND.green};
              line-height:44px;
            ">OB</td>
            <td style="padding-left:12px;">
              <div style="font-family:${BRAND.font};font-size:20px;font-weight:bold;color:#ffffff;line-height:1.2;">OneBank SA</div>
              <div style="font-family:${BRAND.font};font-size:11px;color:#A0C4B1;margin-top:2px;">B2B Treasury Management</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function footer(): string {
  return `
    <tr>
      <td style="background:#F4F6F8;border-top:1px solid ${BRAND.border};padding:24px 40px;text-align:center;">
        <p style="font-family:${BRAND.font};font-size:12px;color:${BRAND.textMuted};margin:0 0 6px;">
          OneBank South Africa &bull; B2B Treasury Management Platform
        </p>
        <p style="font-family:${BRAND.font};font-size:12px;color:${BRAND.textMuted};margin:0 0 6px;">
          <a href="mailto:hello@onebank.co.za" style="color:${BRAND.green};text-decoration:none;">hello@onebank.co.za</a>
        </p>
        <p style="font-family:${BRAND.font};font-size:11px;color:#A0AEC0;margin:0;">
          &copy; ${new Date().getFullYear()} OneBank South Africa. All rights reserved.
        </p>
      </td>
    </tr>
  `;
}

function ctaButton(label: string, url: string): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0;">
      <tr>
        <td align="center" style="
          background:${BRAND.green};
          border-radius:10px;
          padding:0;
        ">
          <a href="${url}" target="_blank" style="
            display:inline-block;
            padding:14px 36px;
            font-family:${BRAND.font};
            font-size:14px;
            font-weight:bold;
            color:#ffffff;
            text-decoration:none;
            border-radius:10px;
          ">${label}</a>
        </td>
      </tr>
    </table>
  `;
}

function wrapper(body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          ${header()}
          <tr>
            <td style="padding:36px 40px 40px;">
              ${body}
            </td>
          </tr>
          ${footer()}
        </table>
        <p style="font-family:${BRAND.font};font-size:11px;color:#A0AEC0;margin-top:20px;">
          If you didn't request this email, you can safely ignore it.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ─── Core sendEmail() ────────────────────────────────────────────────────────

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping send");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[email] Unexpected error:", err);
    return { success: false, error: err };
  }
}

// ─── Template: Verification Email ───────────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationUrl: string
) {
  const html = wrapper(`
    <h1 style="font-family:${BRAND.font};font-size:22px;font-weight:bold;color:${BRAND.textDark};margin:0 0 8px;">
      Verify your email address
    </h1>
    <p style="font-family:${BRAND.font};font-size:14px;color:${BRAND.textMuted};margin:0 0 20px;line-height:1.6;">
      Hi ${name}, welcome to OneBank SA. Please verify your email address to activate your account and get access to your treasury dashboard.
    </p>
    <div style="background:#F0FAF4;border-left:4px solid ${BRAND.gold};border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:4px;">
      <p style="font-family:${BRAND.font};font-size:13px;color:${BRAND.textMuted};margin:0;">
        This verification link expires in <strong style="color:${BRAND.textDark};">24 hours</strong>.
      </p>
    </div>
    ${ctaButton("Verify Email Address", verificationUrl)}
    <p style="font-family:${BRAND.font};font-size:12px;color:#A0AEC0;margin-top:24px;line-height:1.6;">
      Or copy and paste this URL into your browser:<br/>
      <a href="${verificationUrl}" style="color:${BRAND.green};word-break:break-all;">${verificationUrl}</a>
    </p>
  `);

  return sendEmail({
    to,
    subject: "Verify your OneBank SA email address",
    html,
  });
}

// ─── Template: Password Reset Email ─────────────────────────────────────────

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
) {
  const html = wrapper(`
    <h1 style="font-family:${BRAND.font};font-size:22px;font-weight:bold;color:${BRAND.textDark};margin:0 0 8px;">
      Reset your password
    </h1>
    <p style="font-family:${BRAND.font};font-size:14px;color:${BRAND.textMuted};margin:0 0 20px;line-height:1.6;">
      Hi ${name}, we received a request to reset the password for your OneBank SA account. Click the button below to choose a new password.
    </p>
    <div style="background:#FFF8EC;border-left:4px solid ${BRAND.gold};border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:4px;">
      <p style="font-family:${BRAND.font};font-size:13px;color:${BRAND.textMuted};margin:0;">
        This link expires in <strong style="color:${BRAND.textDark};">1 hour</strong>. If you didn't request a password reset, please contact
        <a href="mailto:hello@onebank.co.za" style="color:${BRAND.green};">hello@onebank.co.za</a> immediately.
      </p>
    </div>
    ${ctaButton("Reset Password", resetUrl)}
    <p style="font-family:${BRAND.font};font-size:12px;color:#A0AEC0;margin-top:24px;line-height:1.6;">
      Or copy and paste this URL into your browser:<br/>
      <a href="${resetUrl}" style="color:${BRAND.green};word-break:break-all;">${resetUrl}</a>
    </p>
  `);

  return sendEmail({
    to,
    subject: "Reset your OneBank SA password",
    html,
  });
}

// ─── Template: Team Invite Email ─────────────────────────────────────────────

export async function sendTeamInviteEmail(
  to: string,
  inviterName: string,
  orgName: string,
  role: string,
  inviteUrl: string
) {
  const html = wrapper(`
    <h1 style="font-family:${BRAND.font};font-size:22px;font-weight:bold;color:${BRAND.textDark};margin:0 0 8px;">
      You've been invited to join ${orgName}
    </h1>
    <p style="font-family:${BRAND.font};font-size:14px;color:${BRAND.textMuted};margin:0 0 20px;line-height:1.6;">
      <strong style="color:${BRAND.textDark};">${inviterName}</strong> has invited you to join
      <strong style="color:${BRAND.textDark};">${orgName}</strong> on OneBank SA as a
      <strong style="color:${BRAND.textDark};">${role}</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F0FAF4;border-radius:10px;margin-bottom:4px;">
      <tr>
        <td style="padding:20px 24px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:6px 0;">
                <span style="font-family:${BRAND.font};font-size:12px;color:${BRAND.textMuted};display:block;">Organisation</span>
                <span style="font-family:${BRAND.font};font-size:14px;font-weight:bold;color:${BRAND.textDark};">${orgName}</span>
              </td>
              <td style="padding:6px 0;">
                <span style="font-family:${BRAND.font};font-size:12px;color:${BRAND.textMuted};display:block;">Your Role</span>
                <span style="font-family:${BRAND.font};font-size:14px;font-weight:bold;color:${BRAND.textDark};">${role}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    ${ctaButton("Accept Invitation", inviteUrl)}
    <p style="font-family:${BRAND.font};font-size:12px;color:#A0AEC0;margin-top:24px;line-height:1.6;">
      This invitation expires in <strong>7 days</strong>. Or copy and paste this URL:<br/>
      <a href="${inviteUrl}" style="color:${BRAND.green};word-break:break-all;">${inviteUrl}</a>
    </p>
  `);

  return sendEmail({
    to,
    subject: `${inviterName} invited you to ${orgName} on OneBank SA`,
    html,
  });
}

// ─── Template: Welcome Email ─────────────────────────────────────────────────

export async function sendWelcomeEmail(
  to: string,
  name: string,
  orgName: string
) {
  const features = [
    { icon: "🏦", label: "Multi-bank aggregation", desc: "FNB, Standard Bank, Absa, Nedbank & Capitec in one view" },
    { icon: "✅", label: "Payment workflows", desc: "Multi-level approvals with full audit trail" },
    { icon: "📊", label: "Real-time analytics", desc: "Cash flow reporting and treasury dashboards" },
    { icon: "🔗", label: "ERP integrations", desc: "Sage, SAP, Oracle, Dynamics, Xero & QuickBooks" },
  ];

  const featureRows = features.map(f => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:20px;width:36px;vertical-align:top;padding-top:2px;">${f.icon}</td>
            <td style="padding-left:12px;">
              <div style="font-family:${BRAND.font};font-size:13px;font-weight:bold;color:${BRAND.textDark};">${f.label}</div>
              <div style="font-family:${BRAND.font};font-size:12px;color:${BRAND.textMuted};margin-top:2px;">${f.desc}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join("");

  const html = wrapper(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="
        display:inline-block;
        background:${BRAND.gold};
        border-radius:50%;
        width:56px;height:56px;
        line-height:56px;
        font-family:${BRAND.font};
        font-size:22px;
        font-weight:bold;
        color:${BRAND.green};
        text-align:center;
        margin-bottom:16px;
      ">OB</div>
      <h1 style="font-family:${BRAND.font};font-size:24px;font-weight:bold;color:${BRAND.textDark};margin:0 0 8px;">
        Welcome to OneBank SA, ${name}!
      </h1>
      <p style="font-family:${BRAND.font};font-size:14px;color:${BRAND.textMuted};margin:0;">
        Your account for <strong style="color:${BRAND.textDark};">${orgName}</strong> is ready.
      </p>
    </div>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
      ${featureRows}
    </table>

    ${ctaButton("Go to Dashboard", "https://onebank-sa-iota.vercel.app/overview")}

    <p style="font-family:${BRAND.font};font-size:13px;color:${BRAND.textMuted};margin-top:28px;line-height:1.6;text-align:center;">
      Need help getting started? Reply to this email or reach us at<br/>
      <a href="mailto:hello@onebank.co.za" style="color:${BRAND.green};font-weight:bold;">hello@onebank.co.za</a>
    </p>
  `);

  return sendEmail({
    to,
    subject: `Welcome to OneBank SA — your treasury dashboard is ready`,
    html,
  });
}

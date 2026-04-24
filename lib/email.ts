import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// RESEND_FROM should be set to your verified sender, e.g. "OneBank TMS <hello@onebank.co.za>".
// Falls back to Resend's shared test domain for local/staging environments where
// the custom domain hasn't been verified yet.
const FROM = process.env.RESEND_FROM ?? "OneBank TMS <onboarding@resend.dev>";

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
              <div style="font-family:${BRAND.font};font-size:20px;font-weight:bold;color:#ffffff;line-height:1.2;">OneBank TMS</div>
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
          OneBank TMS &bull; B2B Treasury Management Platform
        </p>
        <p style="font-family:${BRAND.font};font-size:12px;color:${BRAND.textMuted};margin:0 0 6px;">
          <a href="mailto:hello@onebank.co.za" style="color:${BRAND.green};text-decoration:none;">hello@onebank.co.za</a>
        </p>
        <p style="font-family:${BRAND.font};font-size:11px;color:#A0AEC0;margin:0;">
          &copy; ${new Date().getFullYear()} OneBank TMS. All rights reserved.
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
      Hi ${name}, welcome to OneBank TMS. Please verify your email address to activate your account and get access to your treasury dashboard.
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
    subject: "Verify your OneBank TMS email address",
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
      Hi ${name}, we received a request to reset the password for your OneBank TMS account. Click the button below to choose a new password.
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
    subject: "Reset your OneBank TMS password",
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
      <strong style="color:${BRAND.textDark};">${orgName}</strong> on OneBank TMS as a
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
    subject: `${inviterName} invited you to ${orgName} on OneBank TMS`,
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
        Welcome to OneBank TMS, ${name}!
      </h1>
      <p style="font-family:${BRAND.font};font-size:14px;color:${BRAND.textMuted};margin:0;">
        Your account for <strong style="color:${BRAND.textDark};">${orgName}</strong> is ready.
      </p>
    </div>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
      ${featureRows}
    </table>

    ${ctaButton("Go to Dashboard", `${process.env.NEXTAUTH_URL ?? "https://onebank-sa-iota.vercel.app"}/overview`)}

    <p style="font-family:${BRAND.font};font-size:13px;color:${BRAND.textMuted};margin-top:28px;line-height:1.6;text-align:center;">
      Need help getting started? Reply to this email or reach us at<br/>
      <a href="mailto:hello@onebank.co.za" style="color:${BRAND.green};font-weight:bold;">hello@onebank.co.za</a>
    </p>
  `);

  return sendEmail({
    to,
    subject: `Welcome to OneBank TMS — your treasury dashboard is ready`,
    html,
  });
}

// ─── Template: Close-Account Request (internal alert to OneBank TMS team) ─────

export interface CloseAccountEmailPayload {
  adminName:   string;
  adminEmail:  string;
  orgName:     string;
  orgSlug:     string;
  reason:      string;
  details:     string;
  submittedAt: Date;
}

export async function sendCloseAccountRequestToTeam(payload: CloseAccountEmailPayload) {
  const { adminName, adminEmail, orgName, orgSlug, reason, details, submittedAt } = payload;

  const formattedDate = submittedAt.toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    dateStyle: "full",
    timeStyle: "short",
  });

  const html = wrapper(`
    <h1 style="font-family:${BRAND.font};font-size:22px;font-weight:bold;color:#C0392B;margin:0 0 8px;">
      Account Closure Request
    </h1>
    <p style="font-family:${BRAND.font};font-size:14px;color:${BRAND.textMuted};margin:0 0 24px;line-height:1.6;">
      A client has submitted an account closure request. Please review the details below and follow the offboarding checklist.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFF5F5;border-radius:10px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${[
              ["Organisation",    orgName],
              ["Org Slug",        orgSlug],
              ["Admin Name",      adminName],
              ["Admin Email",     adminEmail],
              ["Reason",          reason],
              ["Additional Info", details || "—"],
              ["Submitted At",    formattedDate],
            ].map(([label, value]) => `
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid #FED7D7;vertical-align:top;width:140px;">
                  <span style="font-family:${BRAND.font};font-size:12px;color:${BRAND.textMuted};">${label}</span>
                </td>
                <td style="padding:6px 0 6px 16px;border-bottom:1px solid #FED7D7;vertical-align:top;">
                  <span style="font-family:${BRAND.font};font-size:13px;font-weight:bold;color:${BRAND.textDark};">${value}</span>
                </td>
              </tr>
            `).join("")}
          </table>
        </td>
      </tr>
    </table>

    <div style="background:#FFF8EC;border-left:4px solid ${BRAND.gold};border-radius:0 8px 8px 0;padding:16px 20px;">
      <p style="font-family:${BRAND.font};font-size:13px;color:${BRAND.textDark};margin:0 0 8px;font-weight:bold;">
        Offboarding checklist
      </p>
      <ul style="font-family:${BRAND.font};font-size:13px;color:${BRAND.textMuted};margin:0;padding-left:20px;line-height:2;">
        <li>Confirm no pending/approved payments remain</li>
        <li>Confirm all ERP syncs are stopped</li>
        <li>Provide the client with a full data export</li>
        <li>Apply data retention policy (7-year financial records)</li>
        <li>Deactivate organisation in Prisma (isActive = false)</li>
        <li>Respond to client within 5 business days</li>
      </ul>
    </div>
  `);

  return sendEmail({
    to:      "hello@onebank.co.za",
    subject: `[Action Required] Account closure request — ${orgName}`,
    html,
    replyTo: adminEmail,
  });
}

// ─── Template: Close-Account Confirmation (to the client admin) ──────────────

export async function sendCloseAccountConfirmationToAdmin(payload: CloseAccountEmailPayload) {
  const { adminName, orgName, reason, submittedAt } = payload;

  const formattedDate = submittedAt.toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    dateStyle: "full",
    timeStyle: "short",
  });

  const html = wrapper(`
    <h1 style="font-family:${BRAND.font};font-size:22px;font-weight:bold;color:${BRAND.textDark};margin:0 0 8px;">
      We've received your request
    </h1>
    <p style="font-family:${BRAND.font};font-size:14px;color:${BRAND.textMuted};margin:0 0 24px;line-height:1.6;">
      Hi ${adminName}, your account closure request for <strong style="color:${BRAND.textDark};">${orgName}</strong> has been received and is being reviewed by our team.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F0FAF4;border-radius:10px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${[
              ["Organisation", orgName],
              ["Reason",       reason],
              ["Submitted",    formattedDate],
            ].map(([label, value]) => `
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid ${BRAND.border};vertical-align:top;width:120px;">
                  <span style="font-family:${BRAND.font};font-size:12px;color:${BRAND.textMuted};">${label}</span>
                </td>
                <td style="padding:6px 0 6px 16px;border-bottom:1px solid ${BRAND.border};vertical-align:top;">
                  <span style="font-family:${BRAND.font};font-size:13px;font-weight:bold;color:${BRAND.textDark};">${value}</span>
                </td>
              </tr>
            `).join("")}
          </table>
        </td>
      </tr>
    </table>

    <div style="background:#FFF8EC;border-left:4px solid ${BRAND.gold};border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
      <p style="font-family:${BRAND.font};font-size:13px;color:${BRAND.textMuted};margin:0;line-height:1.7;">
        <strong style="color:${BRAND.textDark};">What happens next?</strong><br/>
        Our team will review your request within <strong>5 business days</strong>. We'll contact you to confirm there are no outstanding payments or active integrations before we proceed. Your account remains fully active until the process is complete.
      </p>
    </div>

    <div style="background:#FFF5F5;border-left:4px solid #FC8181;border-radius:0 8px 8px 0;padding:16px 20px;">
      <p style="font-family:${BRAND.font};font-size:13px;color:${BRAND.textMuted};margin:0;line-height:1.7;">
        <strong style="color:${BRAND.textDark};">Changed your mind?</strong><br/>
        If you'd like to cancel this request, simply reply to this email or contact us at
        <a href="mailto:hello@onebank.co.za" style="color:${BRAND.green};">hello@onebank.co.za</a>
        before our team contacts you.
      </p>
    </div>
  `);

  return sendEmail({
    to:      payload.adminEmail,
    subject: `Your OneBank TMS account closure request has been received`,
    html,
    replyTo: "hello@onebank.co.za",
  });
}

// ─── Template: LG Waitlist Notification (internal alert to OneBank TMS team) ──

export interface LgWaitlistEmailPayload {
  userName:  string;
  userEmail: string;
  orgName:   string;
  lgType:    string;
  joinedAt:  Date;
}

export async function sendLgWaitlistNotification(payload: LgWaitlistEmailPayload) {
  const { userName, userEmail, orgName, lgType, joinedAt } = payload;

  const formattedDate = joinedAt.toLocaleString("en-ZA", {
    timeZone:  "Africa/Johannesburg",
    dateStyle: "full",
    timeStyle: "short",
  });

  const html = wrapper(`
    <h1 style="font-family:${BRAND.font};font-size:22px;font-weight:bold;color:${BRAND.textDark};margin:0 0 8px;">
      New LG Waitlist Signup
    </h1>
    <p style="font-family:${BRAND.font};font-size:14px;color:${BRAND.textMuted};margin:0 0 24px;line-height:1.6;">
      A client has joined the Letters of Guarantee early-access waitlist.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F0FAF4;border-radius:10px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${[
              ["Name",          userName],
              ["Email",         userEmail],
              ["Organisation",  orgName],
              ["LG Type Needed", lgType],
              ["Signed Up",     formattedDate],
            ].map(([label, value]) => `
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid ${BRAND.border};vertical-align:top;width:140px;">
                  <span style="font-family:${BRAND.font};font-size:12px;color:${BRAND.textMuted};">${label}</span>
                </td>
                <td style="padding:6px 0 6px 16px;border-bottom:1px solid ${BRAND.border};vertical-align:top;">
                  <span style="font-family:${BRAND.font};font-size:13px;font-weight:bold;color:${BRAND.textDark};">${value}</span>
                </td>
              </tr>
            `).join("")}
          </table>
        </td>
      </tr>
    </table>

    <div style="background:#FFF8EC;border-left:4px solid ${BRAND.gold};border-radius:0 8px 8px 0;padding:16px 20px;">
      <p style="font-family:${BRAND.font};font-size:13px;color:${BRAND.textMuted};margin:0;line-height:1.7;">
        <strong style="color:${BRAND.textDark};">Next step:</strong> Add this contact to the LG pilot outreach list.
        When you're ready to onboard them, reply to this email or reach out to
        <a href="mailto:${userEmail}" style="color:${BRAND.green};">${userEmail}</a> directly.
      </p>
    </div>
  `);

  return sendEmail({
    to:      "hello@onebank.co.za",
    subject: `[LG Waitlist] ${orgName} — ${lgType}`,
    html,
    replyTo: userEmail,
  });
}

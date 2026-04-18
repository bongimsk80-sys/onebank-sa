import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — OneBank SA",
  description: "OneBank South Africa Privacy Policy — POPIA Compliant",
};

const EFFECTIVE_DATE  = "18 April 2026";
const CONTACT_EMAIL   = "privacy@onebank.co.za";
const IO_REG_NUMBER   = "Pending registration with the Information Regulator (South Africa)";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      {/* Header */}
      <header className="bg-[#1B4332] text-white">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#D4A017] flex items-center justify-center font-bold text-[#1B4332] text-sm">
              OB
            </div>
            <span className="font-bold text-lg">OneBank SA</span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-[#A0C4B1] hover:text-white transition-colors"
          >
            Sign in →
          </Link>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 lg:p-12">
          <p className="text-xs text-[#718096] uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-bold text-[#1A202C] mb-2">Privacy Policy</h1>
          <p className="text-sm text-[#718096] mb-2">Effective date: {EFFECTIVE_DATE}</p>
          <p className="text-xs text-[#A0AEC0] mb-8">{IO_REG_NUMBER}</p>

          {/* POPIA notice */}
          <div className="bg-[#F0FAF4] border border-[#27AE60]/20 rounded-xl px-5 py-4 mb-8">
            <p className="text-sm text-[#1A202C]">
              <strong>POPIA Compliance:</strong> OneBank South Africa is committed to protecting
              your personal information in accordance with the{" "}
              <strong>Protection of Personal Information Act, 2013 (POPIA)</strong> and the{" "}
              <strong>Electronic Communications and Transactions Act, 2002 (ECTA)</strong>.
            </p>
          </div>

          <div className="prose prose-sm max-w-none text-[#4A5568] space-y-8">

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">1. Who We Are (Responsible Party)</h2>
              <p>
                OneBank South Africa (Pty) Ltd ("OneBank", "we", "us") is the responsible party as defined
                under POPIA. We determine the purpose and means of processing your personal information.
              </p>
              <p className="mt-2">
                Information Officer contact:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1B4332] underline">{CONTACT_EMAIL}</a>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">2. Personal Information We Collect</h2>
              <p>We collect and process the following categories of personal information:</p>
              <div className="mt-3 space-y-3">
                {[
                  {
                    category: "Account Information",
                    items: "Full name, work email address, organisation name, role within your organisation.",
                  },
                  {
                    category: "Authentication Data",
                    items: "Hashed passwords, verification tokens (never stored in plain text), session tokens.",
                  },
                  {
                    category: "Financial Operations Data",
                    items: "Payment instructions you initiate or approve, bank account numbers, beneficiary details, transaction references.",
                  },
                  {
                    category: "Usage & Audit Data",
                    items: "IP addresses, login timestamps, actions performed within the platform (for audit trail purposes).",
                  },
                  {
                    category: "Communications",
                    items: "Feedback submitted through the platform, support enquiries.",
                  },
                ].map(({ category, items }) => (
                  <div key={category} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1B4332] flex-shrink-0 mt-2" />
                    <div>
                      <p className="font-semibold text-[#1A202C]">{category}</p>
                      <p className="text-sm text-[#718096]">{items}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">3. Lawful Basis for Processing</h2>
              <p>We process your personal information on the following lawful grounds:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Contract:</strong> Processing necessary to provide the Service you registered for.</li>
                <li><strong>Legal obligation:</strong> Compliance with FICA, POCA, and other applicable South African law.</li>
                <li><strong>Legitimate interest:</strong> Fraud prevention, security monitoring, and platform improvement.</li>
                <li><strong>Consent:</strong> Marketing communications (opt-in only; you may withdraw at any time).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">4. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>To create and manage your account and organisation on the platform.</li>
                <li>To provide treasury management features (payment initiation, approvals, analytics).</li>
                <li>To send transactional emails (verification, password reset, team invitations).</li>
                <li>To maintain an audit trail for financial compliance purposes.</li>
                <li>To detect, investigate, and prevent fraud and security incidents.</li>
                <li>To improve the platform through aggregated, anonymised usage analytics.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">5. Data Sharing & Third Parties</h2>
              <p>We do not sell your personal information. We share data only with:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Neon (database):</strong> Encrypted PostgreSQL cloud database hosted in the EU (GDPR-compliant; covered by POPIA operator agreement).</li>
                <li><strong>Resend (email):</strong> Transactional email delivery. We share only the recipient address and email content.</li>
                <li><strong>Vercel (hosting):</strong> Application infrastructure. Processes request/response data in transit.</li>
                <li><strong>Law enforcement:</strong> Where required by South African law or court order.</li>
              </ul>
              <p className="mt-3">
                All sub-processors are contractually bound to process data only as instructed and to
                maintain appropriate security measures.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">6. Data Security</h2>
              <p>We implement the following technical and organisational measures:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Passwords hashed with bcrypt (cost factor 12) — never stored in plain text.</li>
                <li>ERP API keys encrypted at rest with AES-256.</li>
                <li>All data in transit protected by TLS 1.2+.</li>
                <li>JWT-based sessions with automatic invalidation on password reset.</li>
                <li>Per-IP rate limiting on all authentication endpoints.</li>
                <li>Role-based access control (RBAC) with per-request authorisation checks.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">7. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active or as
                required by law. Financial audit logs are retained for a minimum of 5 years in
                compliance with the Companies Act, 2008. You may request deletion of your account
                (subject to legal retention obligations) by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">8. Your Rights Under POPIA</h2>
              <p>As a data subject under POPIA, you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information.</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations).</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interest.</li>
                <li><strong>Withdrawal of consent:</strong> Withdraw consent for marketing at any time.</li>
                <li><strong>Complaint:</strong> Lodge a complaint with the Information Regulator of South Africa at{" "}
                  <a href="https://www.justice.gov.za/inforeg/" target="_blank" rel="noopener noreferrer" className="text-[#1B4332] underline">www.justice.gov.za/inforeg</a>.
                </li>
              </ul>
              <p className="mt-3">
                To exercise your rights, email:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1B4332] underline">{CONTACT_EMAIL}</a>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">9. Cookies & Tracking</h2>
              <p>
                We use only essential session cookies required for authentication (NextAuth.js session token).
                We do not use third-party analytics, advertising, or tracking cookies. No cookie consent
                banner is required as no non-essential cookies are used.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">10. Cross-Border Data Transfers</h2>
              <p>
                Your data may be processed outside South Africa by our sub-processors (Neon EU, Vercel EU/US,
                Resend US). We ensure adequate safeguards are in place through contractual protections
                consistent with POPIA section 72 requirements.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">11. Changes to This Policy</h2>
              <p>
                We will notify you of material changes to this Privacy Policy by email at least 14 days
                before they take effect. The effective date at the top of this page reflects the most
                recent revision.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">12. Contact</h2>
              <p>
                For any privacy-related queries or to exercise your rights:<br />
                <strong>Information Officer — OneBank South Africa (Pty) Ltd</strong><br />
                Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1B4332] underline">{CONTACT_EMAIL}</a>
              </p>
            </section>

          </div>

          {/* Bottom nav */}
          <div className="mt-10 pt-8 border-t border-[#E2E8F0] flex flex-col sm:flex-row gap-3 items-center justify-between text-sm text-[#718096]">
            <p>© 2026 OneBank South Africa (Pty) Ltd · POPIA Compliant</p>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-[#1B4332] transition-colors">Terms of Service</Link>
              <Link href="/login" className="hover:text-[#1B4332] transition-colors">Sign in</Link>
              <Link href="/register" className="hover:text-[#1B4332] transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

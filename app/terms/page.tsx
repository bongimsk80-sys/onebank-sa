import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — OneBank TMS",
  description: "OneBank TMS Terms of Service",
};

const EFFECTIVE_DATE = "18 April 2026";
const CONTACT_EMAIL  = "legal@onebank.co.za";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      {/* Header */}
      <header className="bg-[#1B4332] text-white">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#D4A017] flex items-center justify-center font-bold text-[#1B4332] text-sm">
              OB
            </div>
            <span className="font-bold text-lg">OneBank TMS</span>
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
          <h1 className="text-3xl font-bold text-[#1A202C] mb-2">Terms of Service</h1>
          <p className="text-sm text-[#718096] mb-8">Effective date: {EFFECTIVE_DATE}</p>

          <div className="prose prose-sm max-w-none text-[#4A5568] space-y-8">

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the OneBank TMS platform ("Service"), you agree to be
                bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms,
                do not use the Service. These Terms constitute a legally binding agreement between
                you ("User") and OneBank South Africa (Pty) Ltd ("OneBank TMS", "we", "us").
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">2. Beta Service Disclaimer</h2>
              <p>
                The Service is currently provided in <strong>beta</strong>. During the beta period:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Payment initiation is in <strong>simulation mode</strong> — no actual funds are transferred.</li>
                <li>Features, data, and availability may change without notice.</li>
                <li>We make no warranties regarding uptime, data retention, or fitness for purpose.</li>
                <li>Beta access is provided free of charge at our discretion and may be withdrawn at any time.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">3. Eligibility & Account Registration</h2>
              <p>
                The Service is intended for registered South African business entities. By registering, you
                warrant that:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>You are authorised to bind your organisation to these Terms.</li>
                <li>All information provided during registration is accurate and complete.</li>
                <li>You will maintain the confidentiality of your login credentials.</li>
                <li>You will immediately notify us of any unauthorised access at <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1B4332] underline">{CONTACT_EMAIL}</a>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">4. Permitted Use</h2>
              <p>You may use the Service solely for lawful treasury management purposes within South Africa. You must not:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Use the Service for money laundering, fraud, or any activity that violates the Financial Intelligence Centre Act (FICA) or the Prevention of Organised Crime Act (POCA).</li>
                <li>Attempt to gain unauthorised access to other organisations' data.</li>
                <li>Reverse-engineer, decompile, or scrape the Service.</li>
                <li>Transmit malicious code or interfere with Service integrity.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">5. Data & Privacy</h2>
              <p>
                Your use of the Service is also governed by our{" "}
                <Link href="/privacy" className="text-[#1B4332] underline">Privacy Policy</Link>,
                which is incorporated into these Terms by reference. We process personal information
                in accordance with the Protection of Personal Information Act, 2013 (POPIA).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">6. Intellectual Property</h2>
              <p>
                All content, branding, software, and intellectual property on the Service is owned by
                OneBank TMS (OneBank South Africa (Pty) Ltd). Nothing in these Terms grants you any ownership rights.
                You may not use our trademarks without prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">7. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by South African law, OneBank TMS shall not be liable for
                any indirect, incidental, special, consequential, or punitive damages, including lost
                profits, arising from your use of the Service. Our total liability shall not exceed the
                amount you paid us in the 12 months preceding the claim. This limitation does not apply
                to fraud or wilful misconduct by OneBank TMS.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">8. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless OneBank TMS, its directors, employees, and agents
                from any claims, damages, or expenses (including reasonable legal fees) arising out of
                your use of the Service, your violation of these Terms, or your infringement of any
                third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">9. Termination</h2>
              <p>
                We may suspend or terminate your access at any time for breach of these Terms, or for
                any reason during the beta period. You may terminate your account by contacting us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1B4332] underline">{CONTACT_EMAIL}</a>.
                Upon termination, your right to use the Service ceases immediately.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">10. Governing Law & Dispute Resolution</h2>
              <p>
                These Terms are governed by the laws of the Republic of South Africa. Any disputes
                shall be resolved in the courts of Johannesburg, Gauteng, South Africa. You waive any
                objection to jurisdiction or venue in those courts.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">11. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. Material changes will be communicated
                by email or by prominent notice on the Service. Continued use after the effective date
                constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A202C] mb-3">12. Contact</h2>
              <p>
                Questions about these Terms should be directed to:<br />
                <strong>OneBank South Africa (Pty) Ltd</strong><br />
                Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1B4332] underline">{CONTACT_EMAIL}</a>
              </p>
            </section>

          </div>

          {/* Bottom nav */}
          <div className="mt-10 pt-8 border-t border-[#E2E8F0] flex flex-col sm:flex-row gap-3 items-center justify-between text-sm text-[#718096]">
            <p>© 2026 OneBank TMS (OneBank South Africa (Pty) Ltd)</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-[#1B4332] transition-colors">Privacy Policy</Link>
              <Link href="/login" className="hover:text-[#1B4332] transition-colors">Sign in</Link>
              <Link href="/register" className="hover:text-[#1B4332] transition-colors">Register</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — UXLora",
  description: "How UXLora collects, uses, and protects your data.",
};

const LAST_UPDATED = "April 26, 2026";
const CONTACT_EMAIL = "support@uxlora.app";
const COMPANY = "Ard";
const PRODUCT = "UXLora";
const SITE = "uxlora.app";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <nav className="border-b border-[#1f1f2e] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            UX<span className="text-[#7c3aed]">Lora</span>
          </Link>
          <Link
            href="/sign-in"
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[#7c3aed] text-sm font-medium mb-3 uppercase tracking-wider">
            Legal
          </p>
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-white/40 text-sm">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        {/* Intro */}
        <div className="bg-[#13131a] border border-[#1f1f2e] rounded-2xl p-8 mb-8">
          <p className="text-white/70 leading-relaxed">
            {PRODUCT} is operated by {COMPANY}. This Privacy Policy explains how we collect,
            use, store, and protect your information when you use {PRODUCT} at{" "}
            <span className="text-white">{SITE}</span>. By using {PRODUCT}, you agree to
            the practices described in this policy. If you disagree with any part, please
            discontinue use of the service.
          </p>
        </div>

        <div className="space-y-10">
          <Section title="1. Information We Collect">
            <SubSection title="Account Information">
              When you create an account, we collect your name, email address, and
              password (stored as a secure hash via Supabase Auth). If you sign in
              via Google OAuth, we receive your name and email from Google.
            </SubSection>
            <SubSection title="Usage Data">
              We collect data about how you use {PRODUCT} — including kit generation
              requests, screen counts, export actions, feature interactions, and
              session activity. This helps us improve the product and enforce
              subscription limits.
            </SubSection>
            <SubSection title="Generated Content">
              The UI kits, design systems, and screens you generate are stored in
              our database linked to your account. This includes the input you
              provided (plain text descriptions or uploaded documents) and the
              outputs {PRODUCT} produced.
            </SubSection>
            <SubSection title="Billing Information">
              Payments are processed by Lemon Squeezy. We do not store your credit
              card number or full payment details. We receive and store a customer
              ID and subscription ID from Lemon Squeezy to manage your subscription
              status.
            </SubSection>
            <SubSection title="Technical Data">
              We automatically collect IP addresses, browser type, device
              information, and access logs for security monitoring and abuse
              prevention. This data is not sold or shared with advertisers.
            </SubSection>
            <SubSection title="Referral Data">
              If you use or share a referral code, we store which code was used
              and the referral relationship between accounts to apply credits
              correctly.
            </SubSection>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="space-y-3 text-white/70 leading-relaxed">
              {[
                "To create and manage your account and verify your identity.",
                "To enforce subscription tier limits (generations per month).",
                "To send transactional emails — account confirmation, password reset, kit completion notifications — via Resend.",
                "To process payments and manage your subscription via Lemon Squeezy.",
                "To apply referral credits when referral conditions are met.",
                "To monitor for abuse, fraud, and security threats.",
                "To improve UXLora's prompts, generation quality, and product features.",
                "To communicate important service updates or changes to this policy.",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[#7c3aed] mt-1 flex-shrink-0">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-white/70 mt-4">
              We do not sell your data. We do not use your data for advertising.
              We do not share your personal information with third parties except
              as described in Section 3.
            </p>
          </Section>

          <Section title="3. Third-Party Services">
            <p className="text-white/70 mb-4">
              {PRODUCT} uses the following third-party services that may process
              your data:
            </p>
            <div className="space-y-4">
              {[
                {
                  name: "Supabase",
                  purpose: "Database, authentication, and file storage. Your account data and generated kits are stored on Supabase infrastructure.",
                  link: "https://supabase.com/privacy",
                },
                {
                  name: "Lemon Squeezy",
                  purpose: "Payment processing and subscription management. Your billing information is handled by Lemon Squeezy and subject to their privacy policy.",
                  link: "https://www.lemonsqueezy.com/privacy",
                },
                {
                  name: "Resend",
                  purpose: "Transactional email delivery. Your email address is shared with Resend to deliver account and notification emails.",
                  link: "https://resend.com/privacy",
                },
                {
                  name: "Vercel",
                  purpose: "Hosting and deployment infrastructure. Vercel processes request logs and technical data as part of serving the application.",
                  link: "https://vercel.com/legal/privacy-policy",
                },
              ].map((s) => (
                <div
                  key={s.name}
                  className="bg-[#0f0f17] border border-[#1f1f2e] rounded-xl p-5"
                >
                  <p className="font-semibold text-white mb-1">{s.name}</p>
                  <p className="text-white/60 text-sm leading-relaxed mb-2">
                    {s.purpose}
                  </p>
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9d70e5] text-xs hover:underline"
                  >
                    View their privacy policy →
                  </a>
                </div>
              ))}
            </div>
          </Section>

          <Section title="4. Data Storage and Security">
            <p className="text-white/70 leading-relaxed mb-4">
              Your data is stored on Supabase infrastructure with row-level
              security (RLS) policies enforced at the database level — meaning
              your data is only accessible to your own account. We use HTTPS
              for all data transmission and enforce secure session management.
            </p>
            <p className="text-white/70 leading-relaxed mb-4">
              Passwords are never stored in plain text. Authentication is handled
              by Supabase Auth using industry-standard hashing.
            </p>
            <p className="text-white/70 leading-relaxed">
              Despite these measures, no system is completely secure. We cannot
              guarantee absolute security and are not liable for unauthorized
              access beyond our reasonable control. If you believe your account
              has been compromised, contact us immediately at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[#9d70e5] hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section title="5. Data Retention">
            <p className="text-white/70 leading-relaxed mb-4">
              We retain your account data and generated kits for as long as your
              account is active. If you delete your account, we will delete your
              personal data and generated content within 30 days, except where
              retention is required by law or for legitimate business purposes
              such as fraud prevention.
            </p>
            <p className="text-white/70 leading-relaxed">
              Billing records may be retained for up to 7 years to comply with
              financial regulations, even after account deletion.
            </p>
          </Section>

          <Section title="6. Your Rights">
            <p className="text-white/70 mb-4">
              Depending on your location, you may have the following rights
              regarding your personal data:
            </p>
            <ul className="space-y-3 text-white/70">
              {[
                { right: "Access", desc: "Request a copy of the personal data we hold about you." },
                { right: "Correction", desc: "Request correction of inaccurate or incomplete data." },
                { right: "Deletion", desc: "Request deletion of your account and associated data." },
                { right: "Portability", desc: "Request your data in a machine-readable format." },
                { right: "Objection", desc: "Object to processing of your data in certain circumstances." },
                { right: "Restriction", desc: "Request that we restrict processing of your data." },
              ].map((item) => (
                <li key={item.right} className="flex gap-3">
                  <span className="text-[#7c3aed] mt-1 flex-shrink-0">→</span>
                  <span>
                    <span className="text-white font-medium">{item.right}:</span>{" "}
                    {item.desc}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-white/70 mt-4">
              To exercise any of these rights, email us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[#9d70e5] hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              . We will respond within 30 days.
            </p>
          </Section>

          <Section title="7. Cookies">
            <p className="text-white/70 leading-relaxed mb-4">
              {PRODUCT} uses cookies solely for authentication session management.
              We do not use tracking cookies, advertising cookies, or third-party
              analytics cookies. The session cookie is essential for the service
              to function and cannot be disabled while using {PRODUCT}.
            </p>
          </Section>

          <Section title="8. Children's Privacy">
            <p className="text-white/70 leading-relaxed">
              {PRODUCT} is not directed at children under the age of 13. We do
              not knowingly collect personal information from children under 13.
              If you believe a child under 13 has provided us with personal
              information, please contact us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[#9d70e5] hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              and we will delete the information.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p className="text-white/70 leading-relaxed">
              We may update this Privacy Policy from time to time. When we make
              material changes, we will notify you by email and update the "Last
              updated" date at the top of this page. Your continued use of{" "}
              {PRODUCT} after changes are posted constitutes acceptance of the
              updated policy.
            </p>
          </Section>

          <Section title="10. Contact">
            <p className="text-white/70 leading-relaxed">
              For any privacy-related questions, requests, or concerns, contact
              us at:
            </p>
            <div className="mt-4 bg-[#0f0f17] border border-[#1f1f2e] rounded-xl p-5">
              <p className="text-white font-semibold">{COMPANY}</p>
              <p className="text-white/60 text-sm mt-1">{PRODUCT}</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[#9d70e5] text-sm hover:underline mt-1 block"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </Section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-[#1f1f2e] flex flex-wrap gap-6 text-sm text-white/40">
          <Link href="/" className="hover:text-white transition-colors">
            uxlora.app
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-white transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-5 pb-3 border-b border-[#1f1f2e]">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      <p className="text-white/70 leading-relaxed">{children}</p>
    </div>
  );
}

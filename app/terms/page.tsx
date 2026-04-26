import Link from "next/link";

export const metadata = {
  title: "Terms of Service — UXLora",
  description: "Terms and conditions for using UXLora.",
};

const LAST_UPDATED = "April 26, 2026";
const CONTACT_EMAIL = "support@uxlora.app";
const COMPANY = "Ard";
const PRODUCT = "UXLora";
const SITE = "uxlora.app";

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-white/40 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        {/* Intro */}
        <div className="bg-[#13131a] border border-[#1f1f2e] rounded-2xl p-8 mb-8">
          <p className="text-white/70 leading-relaxed">
            These Terms of Service ("Terms") govern your access to and use of{" "}
            {PRODUCT}, operated by {COMPANY} ("we", "us", "our"), accessible at{" "}
            <span className="text-white">{SITE}</span>. By creating an account or
            using {PRODUCT}, you agree to be bound by these Terms. If you do not
            agree, do not use the service.
          </p>
        </div>

        <div className="space-y-10">
          <Section title="1. Description of Service">
            <p className="text-white/70 leading-relaxed mb-4">
              {PRODUCT} is an AI-powered UI kit generation tool that creates
              design systems, screen layouts, and interface components for game
              developers, mobile app developers, and web product designers.
              Users provide text descriptions or document uploads; {PRODUCT}{" "}
              generates HTML/CSS-based UI kits exported as PNG files.
            </p>
            <p className="text-white/70 leading-relaxed">
              {PRODUCT} is provided as a subscription software-as-a-service
              (SaaS). Features available to you depend on your subscription tier
              as described in Section 4.
            </p>
          </Section>

          <Section title="2. Eligibility and Accounts">
            <SubSection title="Eligibility">
              You must be at least 13 years old to use {PRODUCT}. By using the
              service, you represent that you meet this requirement. If you are
              using {PRODUCT} on behalf of a company or organization, you
              represent that you have the authority to bind that entity to these
              Terms.
            </SubSection>
            <SubSection title="Account Registration">
              You must provide accurate and complete information when creating
              your account. You are responsible for maintaining the security of
              your account credentials. Do not share your password. Notify us
              immediately at {CONTACT_EMAIL} if you suspect unauthorized access
              to your account.
            </SubSection>
            <SubSection title="One Account Per User">
              Each person may maintain only one account. Creating multiple
              accounts to circumvent generation limits or referral restrictions
              is prohibited and may result in termination of all associated
              accounts.
            </SubSection>
          </Section>

          <Section title="3. Acceptable Use">
            <p className="text-white/70 mb-4">
              You agree to use {PRODUCT} only for lawful purposes and in
              accordance with these Terms. You must not:
            </p>
            <ul className="space-y-3 text-white/70">
              {[
                "Use the service to generate content that is illegal, harmful, threatening, abusive, defamatory, or otherwise objectionable.",
                "Attempt to reverse engineer, decompile, or extract the underlying AI prompts, generation logic, or proprietary systems of UXLora.",
                "Use automated scripts, bots, or any non-human means to interact with the service or to circumvent generation limits.",
                "Resell, sublicense, or redistribute access to UXLora as a competing service without our written permission.",
                "Attempt to gain unauthorized access to any part of the service, other users' accounts, or our infrastructure.",
                "Upload documents containing malicious code, personal data of others without consent, or content that infringes third-party rights.",
                "Use the service in any way that could disable, overburden, or impair UXLora's infrastructure.",
                "Circumvent, disable, or interfere with security-related features of the service.",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-red-400/70 mt-1 flex-shrink-0">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-white/70 mt-4">
              We reserve the right to suspend or terminate accounts that violate
              these rules at our sole discretion, without prior notice.
            </p>
          </Section>

          <Section title="4. Subscription Tiers and Billing">
            <SubSection title="Free Demo">
              New accounts receive one free demo generation. Demo kit exports are
              not available — the export pipeline does not run for demo generations.
              To export your kits as PNG files, a paid subscription is required.
            </SubSection>
            <SubSection title="Paid Tiers">
              {PRODUCT} offers Starter, Pro, and Studio subscription tiers with
              monthly generation limits. Current pricing is available on the
              pricing page. Generations reset on the first day of each calendar
              month. Unused generations do not roll over.
            </SubSection>
            <SubSection title="Founding Member Pricing">
              Users who subscribed during the founding member period receive a
              permanent 50% discount on their chosen tier. This discount applies
              for the lifetime of the subscription, including after price
              increases. The founding member discount is non-transferable and
              applies only to the tier selected at founding member signup.
            </SubSection>
            <SubSection title="Extra Generation Packs">
              Studio tier subscribers may purchase additional generation packs
              when their monthly limit is reached. These packs are one-time
              purchases and expire at the end of the billing month.
            </SubSection>
            <SubSection title="Billing and Renewal">
              Subscriptions are billed monthly through Lemon Squeezy. Your
              subscription renews automatically unless cancelled before the
              renewal date. You authorize us to charge your payment method on
              file at the start of each billing period.
            </SubSection>
            <SubSection title="Refund Policy">
              Due to the AI-generated nature of our service, all sales are final.
              We do not offer refunds for completed generation credits or months
              of service already rendered. If you experience a technical issue
              that prevents you from using the service, contact us at{" "}
              {CONTACT_EMAIL} within 7 days and we will investigate and provide
              a resolution at our discretion.
            </SubSection>
            <SubSection title="Cancellation">
              You may cancel your subscription at any time through your account
              settings. Cancellation takes effect at the end of the current
              billing period. You retain access to your account and previously
              generated kits after cancellation, but cannot generate new kits
              once your subscription ends.
            </SubSection>
          </Section>

          <Section title="5. Intellectual Property">
            <SubSection title="Your Input">
              You retain ownership of any text descriptions, game design documents,
              or other content you upload to {PRODUCT}. By uploading content, you
              grant us a limited license to process it through our AI pipeline
              solely for the purpose of generating your requested output.
            </SubSection>
            <SubSection title="Generated Output">
              Subject to your compliance with these Terms and an active paid
              subscription, you own the UI kit outputs generated by {PRODUCT}
              for your account. You may use these outputs for any commercial or
              non-commercial purpose, including in shipped games, apps, or
              products.
            </SubSection>
            <SubSection title="Free Demo Outputs">
              Outputs from the free demo tier are provided for evaluation purposes
              only. Commercial use of demo outputs without a paid subscription
              is not permitted.
            </SubSection>
            <SubSection title="UXLora Platform">
              {PRODUCT}, its name, logo, design, underlying technology, prompt
              systems, generation engine, and all platform content remain the
              exclusive intellectual property of {COMPANY}. These Terms do not
              grant you any rights in the {PRODUCT} platform itself.
            </SubSection>
            <SubSection title="AI-Generated Content Disclaimer">
              AI-generated outputs may occasionally resemble existing designs.
              We make no warranty that generated outputs are free from similarity
              to third-party designs. You are responsible for reviewing generated
              content before commercial use.
            </SubSection>
          </Section>

          <Section title="6. Referral Program">
            <p className="text-white/70 leading-relaxed mb-4">
              {PRODUCT} offers a referral program where you can earn free months
              of service by referring paying users. The referral program is
              subject to the following conditions:
            </p>
            <ul className="space-y-3 text-white/70">
              {[
                "Referral credits are awarded only when a referred user subscribes to a paid plan and remains subscribed for a qualifying period.",
                "Self-referrals are not permitted. Referring your own accounts or accounts you control will result in disqualification.",
                "Referral credits may only be applied to your own subscription and are non-transferable.",
                "We reserve the right to modify, suspend, or terminate the referral program at any time.",
                "Fraudulent referral activity will result in account termination and forfeiture of all referral credits.",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[#7c3aed] mt-1 flex-shrink-0">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="7. Disclaimers and Limitations">
            <SubSection title="Service Availability">
              {PRODUCT} is provided "as is" and "as available." We do not
              guarantee uninterrupted, error-free service. AI generation may
              occasionally produce unexpected results. We reserve the right to
              modify, suspend, or discontinue any part of the service at any
              time.
            </SubSection>
            <SubSection title="No Warranty">
              To the maximum extent permitted by law, {COMPANY} disclaims all
              warranties, express or implied, including warranties of
              merchantability, fitness for a particular purpose, and
              non-infringement. We do not warrant that generated outputs will
              meet your specific requirements.
            </SubSection>
            <SubSection title="Limitation of Liability">
              To the maximum extent permitted by applicable law, {COMPANY} shall
              not be liable for any indirect, incidental, special, consequential,
              or punitive damages arising from your use of {PRODUCT}. Our total
              liability to you shall not exceed the amount you paid to us in the
              three months preceding the claim.
            </SubSection>
          </Section>

          <Section title="8. Termination">
            <p className="text-white/70 leading-relaxed mb-4">
              We may suspend or terminate your account at any time for violation
              of these Terms, fraudulent activity, abuse of the service, or any
              other reason at our sole discretion. We will make reasonable efforts
              to notify you before termination except in cases of serious
              violations.
            </p>
            <p className="text-white/70 leading-relaxed">
              Upon termination, your right to use {PRODUCT} ceases immediately.
              Sections 5 (Intellectual Property), 7 (Disclaimers), and 9
              (Governing Law) survive termination.
            </p>
          </Section>

          <Section title="9. Governing Law">
            <p className="text-white/70 leading-relaxed">
              These Terms are governed by and construed in accordance with
              applicable law. Any disputes arising from these Terms or your use
              of {PRODUCT} shall first be attempted to be resolved through good
              faith negotiation. If resolution cannot be reached, disputes shall
              be subject to binding arbitration. Nothing in these Terms prevents
              either party from seeking injunctive or equitable relief in a court
              of competent jurisdiction.
            </p>
          </Section>

          <Section title="10. Changes to Terms">
            <p className="text-white/70 leading-relaxed">
              We may update these Terms from time to time. When we make material
              changes, we will notify you via email and update the "Last updated"
              date. Your continued use of {PRODUCT} after changes are effective
              constitutes acceptance. If you do not agree to the updated Terms,
              you must stop using the service.
            </p>
          </Section>

          <Section title="11. Contact">
            <p className="text-white/70 leading-relaxed mb-4">
              For any questions about these Terms, contact us at:
            </p>
            <div className="bg-[#0f0f17] border border-[#1f1f2e] rounded-xl p-5">
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
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
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

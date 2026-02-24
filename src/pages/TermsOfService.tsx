import { Link } from 'react-router-dom';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-primary)] sticky top-0 z-10">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-4">
          <Link
            to="/"
            className="font-display font-bold text-xl text-[var(--text-primary)] hover:opacity-90 transition-opacity inline-flex items-center"
          >
            <span className="relative inline-flex items-baseline">
              acquiro<span className="text-accent">.</span>
              <span className="absolute right-[-1em] bottom-[2.2em] font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--text-tertiary)]">BETA</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-4 sm:px-6 py-12 md:py-16">
        <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">Terms of Service</h1>
        <p className="text-[var(--text-tertiary)] text-sm mb-12">Last updated: February 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-[var(--text-secondary)]">
          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using Acquiro (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">2. Description of Service</h2>
            <p>
              Acquiro provides AI-powered M&A (mergers and acquisitions) advisory services. This includes a personalised AI advisor that you configure, unlimited text and voice conversations, deal matching, and access to a dashboard with curated acquisition opportunities. The Service is intended for informational and advisory purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">3. Important Disclaimers</h2>
            <p className="mb-3">
              <strong className="text-[var(--text-primary)]">Not professional advice.</strong> The AI advisor and all content provided through the Service are for general informational purposes only. They do not constitute:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Legal advice</li>
              <li>Financial, investment, or tax advice</li>
              <li>Professional M&A or due diligence services</li>
            </ul>
            <p>
              You should consult qualified professionals (lawyers, accountants, financial advisers) before making any acquisition or business decisions. Acquiro is not responsible for any decisions you make based on the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">4. Subscription and Payment</h2>
            <p className="mb-3">
              Access to the full Service requires a paid subscription. By subscribing, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pay the applicable fees (e.g. £1/month or annual equivalent) at the time of purchase.</li>
              <li>Provide accurate payment information. Payments are processed securely by Stripe.</li>
              <li>Automatic renewal of your subscription unless you cancel before the renewal date.</li>
              <li>Refunds are handled in accordance with our 30-day guarantee, where applicable.</li>
            </ul>
            <p className="mt-3">
              You may cancel your subscription at any time. Upon cancellation, you retain access until the end of your current billing period. Your advisor configuration is saved and can be restored if you resubscribe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">5. Account and Eligibility</h2>
            <p>
              You must be at least 18 years old and have the legal capacity to enter into these Terms. You are responsible for maintaining the confidentiality of your account and for all activity under your account. You must provide accurate and complete information when creating your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">6. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any illegal purpose or in violation of any laws.</li>
              <li>Attempt to reverse engineer, decompile, or extract the underlying technology of the Service.</li>
              <li>Use automated means (bots, scrapers) to access the Service without our permission.</li>
              <li>Interfere with or disrupt the Service or its infrastructure.</li>
              <li>Share your account or credentials with others.</li>
              <li>Use the Service to generate harmful, misleading, or inappropriate content.</li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate your account if we believe you have violated these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">7. Intellectual Property</h2>
            <p>
              The Service, including its design, software, content, and branding, is owned by Acquiro or its licensors. You may not copy, modify, distribute, or create derivative works without our written permission. You retain ownership of any content you provide (e.g. messages, preferences), and you grant us a licence to use it to provide and improve the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Acquiro and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill, arising from your use of the Service. Our total liability for any claims arising from these Terms or the Service shall not exceed the amount you paid us in the twelve months preceding the claim. Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">9. Service Availability</h2>
            <p>
              We strive to keep the Service available but do not guarantee uninterrupted access. We may modify, suspend, or discontinue the Service or any part of it at any time, with or without notice. We are not liable for any such changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">10. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after changes constitutes acceptance of the new Terms. If you do not agree, you must stop using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">12. Contact</h2>
            <p>
              For questions about these Terms of Service, contact us at{' '}
              <a href="mailto:legal@acquiro.com" className="text-accent hover:underline">legal@acquiro.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-[var(--border)]">
          <Link to="/" className="text-accent hover:underline text-sm font-medium">
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}

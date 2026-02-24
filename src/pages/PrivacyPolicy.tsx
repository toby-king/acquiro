import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
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
        <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">Privacy Policy</h1>
        <p className="text-[var(--text-tertiary)] text-sm mb-12">Last updated: February 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-[var(--text-secondary)]">
          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">1. Introduction</h2>
            <p>
              Acquiro (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) provides AI-powered M&A advisory services for modern acquirers. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect information you provide directly and through your use of our services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-[var(--text-primary)]">Account information:</strong> Name, email address, and authentication data (magic link login).</li>
              <li><strong className="text-[var(--text-primary)]">Advisor configuration:</strong> Your preferences for your AI advisor, including personality type, traits, challenge style, voice selection, and advisor name.</li>
              <li><strong className="text-[var(--text-primary)]">Conversation data:</strong> Messages exchanged with your AI advisor, including text chat and voice call content.</li>
              <li><strong className="text-[var(--text-primary)]">Payment information:</strong> Processed by Stripe. We do not store full card details; Stripe handles payment data in accordance with their privacy policy.</li>
              <li><strong className="text-[var(--text-primary)]">Usage data:</strong> How you interact with our app, including pages visited and features used.</li>
              <li><strong className="text-[var(--text-primary)]">Technical data:</strong> Device type, browser, IP address, and similar identifiers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">3. How We Use Your Information</h2>
            <p className="mb-3">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our AI advisory and deal-matching services.</li>
              <li>Personalise your advisor experience and deliver relevant matches.</li>
              <li>Process subscriptions and payments.</li>
              <li>Send transactional emails (e.g. magic links, subscription confirmations).</li>
              <li>Respond to support requests and communicate with you.</li>
              <li>Detect and prevent fraud, abuse, and security issues.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">4. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services that may process your data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-[var(--text-primary)]">Stripe:</strong> Payment processing. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Stripe&apos;s Privacy Policy</a>.</li>
              <li><strong className="text-[var(--text-primary)]">OpenAI:</strong> AI chat and response generation. See <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">OpenAI&apos;s Privacy Policy</a>.</li>
              <li><strong className="text-[var(--text-primary)]">ElevenLabs:</strong> Voice synthesis and real-time conversation. See <a href="https://elevenlabs.io/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">ElevenLabs&apos;s Privacy Policy</a>.</li>
              <li><strong className="text-[var(--text-primary)]">Bubble:</strong> Backend infrastructure for user accounts, agent storage, and deal matching.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">5. Cookies and Local Storage</h2>
            <p>
              We use local storage to persist your theme preference (dark/light mode) and session data (e.g. advisor configuration, user ID). We do not use tracking cookies for advertising. Essential cookies may be used for authentication and security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide services. After cancellation, we may retain certain data for legal, regulatory, or legitimate business purposes. You may request deletion of your personal data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">7. Your Rights</h2>
            <p className="mb-3">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access, correct, or delete your personal data.</li>
              <li>Object to or restrict processing.</li>
              <li>Data portability.</li>
              <li>Withdraw consent where processing is consent-based.</li>
              <li>Lodge a complaint with a supervisory authority (e.g. ICO in the UK).</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at the email below.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">8. Security</h2>
            <p>
              We implement appropriate technical and organisational measures to protect your data. Payment data is handled by Stripe and never stored on our servers. Communications with our services use HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">9. International Transfers</h2>
            <p>
              Your data may be processed in the United Kingdom, European Economic Area, and other jurisdictions where our service providers operate. We ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">10. Changes</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">11. Contact</h2>
            <p>
              For questions about this Privacy Policy or your personal data, contact us at{' '}
              <a href="mailto:privacy@acquiro.com" className="text-accent hover:underline">privacy@acquiro.com</a>.
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

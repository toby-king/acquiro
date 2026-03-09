import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { getMyAgent } from '../../services/settingsService';

function sanitiseAgentName(name: string): string {
  return (name ?? 'agent')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase() || 'agent';
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function LangcliffeCard({ userId }: { userId: string }) {
  const [agentEmail, setAgentEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAgent(userId)
      .then((agent) => {
        if (agent) {
          const name = agent.name_text ?? agent.name ?? 'agent';
          setAgentEmail(`${sanitiseAgentName(name)}@acquiro-agent.com`);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <section className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Langcliffe International Daily List</h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
            Automatically score and respond to Langcliffe deal teasers on your behalf.
          </p>
        </div>
        <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wider">
          Active
        </span>
      </div>

      <p className="text-sm text-[var(--text-secondary)] mt-4 leading-relaxed">
        Langcliffe International sends a daily email listing businesses available for acquisition across the UK. Once set up, Acquiro will automatically receive this list, score each opportunity against your acquisition criteria, and draft outreach emails for admin review — so you never miss a relevant deal.
      </p>

      <div className="mt-5 space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Setup instructions</h3>

        <ol className="space-y-4 text-sm text-[var(--text-secondary)]">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center mt-0.5">1</span>
            <div>
              <p className="text-[var(--text-primary)] font-medium">Sign up to the Langcliffe daily list</p>
              <p className="mt-0.5">Register to receive Langcliffe International's daily deal teasers at their website.</p>
              <a
                href="https://www.langcliffeinternational.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-accent hover:underline text-xs font-medium"
              >
                langcliffeinternational.com <ExternalLink size={11} />
              </a>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center mt-0.5">2</span>
            <div>
              <p className="text-[var(--text-primary)] font-medium">Set up email forwarding</p>
              <p className="mt-0.5">
                In your email client, create a forwarding rule so that any email from{' '}
                <span className="font-mono text-[var(--text-primary)] text-xs bg-[var(--bg-secondary)] px-1 py-0.5 rounded">@langcliffeinternational.com</span>{' '}
                is automatically forwarded to your Acquiro agent address below.
              </p>
              <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                In Gmail: Settings → See all settings → Forwarding and POP/IMAP → Add a forwarding address, then create a filter matching the sender domain.
              </p>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center mt-0.5">3</span>
            <div>
              <p className="text-[var(--text-primary)] font-medium">Your Acquiro agent address</p>
              <p className="mt-0.5">Forward Langcliffe emails to this address:</p>

              {loading ? (
                <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-tertiary)]">
                  <Loader2 size={12} className="animate-spin" /> Loading…
                </div>
              ) : agentEmail ? (
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-sm font-mono text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border)] px-3 py-1.5 rounded-lg">
                    {agentEmail}
                  </code>
                  <CopyButton text={agentEmail} />
                </div>
              ) : (
                <p className="mt-2 text-xs text-[var(--text-tertiary)] italic">Agent email not found — check your Settings.</p>
              )}
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center mt-0.5">4</span>
            <div>
              <p className="text-[var(--text-primary)] font-medium">You're done</p>
              <p className="mt-0.5">
                Once forwarding is active, Acquiro will process each daily list automatically. Matched opportunities will appear in the admin queue for review before any emails are sent on your behalf.
              </p>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}

function DealsuiteCard() {
  return (
    <section className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Dealsuite</h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
            Connect to Dealsuite's M&amp;A deal flow platform to discover and pursue additional acquisition opportunities.
          </p>
        </div>
        <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border)] uppercase tracking-wider">
          Coming soon
        </span>
      </div>

      <p className="text-sm text-[var(--text-secondary)] mt-4 leading-relaxed">
        Dealsuite integration will allow Acquiro to automatically browse and engage with deal flow from Dealsuite's authenticated platform, significantly expanding the range of opportunities your advisor can pursue on your behalf.
      </p>
    </section>
  );
}

export function IntegrationsPage() {
  const { userId } = useAdvisorStore();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <header className="w-full px-4 sm:px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="font-display font-bold text-xl text-[var(--text-primary)]">Integrations</h1>
        <div className="w-[120px]" aria-hidden />
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6">
        {userId ? (
          <>
            <LangcliffeCard userId={userId} />
            <DealsuiteCard />
          </>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">Please log in to manage integrations.</p>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check, ExternalLink, Loader2, ChevronDown, Sparkles } from 'lucide-react';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { getMyAgent, getMyBuyerInfo, updateBuyerInfo } from '../../services/settingsService';
import { getApiUrl } from '../../services/checkoutService';
import langcliffeLogo from '../../assets/langcliffe-logo.png';
import dealsuitelogo from '../../assets/dealsuite-logo.png';

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
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  // Company overview
  const [buyerInfoId, setBuyerInfoId] = useState<string | null>(null);
  const [overview, setOverview] = useState('');
  const [overviewSaving, setOverviewSaving] = useState(false);
  const [overviewSaved, setOverviewSaved] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  useEffect(() => {
    Promise.all([
      getMyAgent(userId),
      getMyBuyerInfo(userId),
    ]).then(([agent, buyerInfo]) => {
      if (agent) {
        const name = agent.name_text ?? 'agent';
        setAgentEmail(`${sanitiseAgentName(name)}@acquiro-agent.com`);
      }
      if (buyerInfo) {
        setBuyerInfoId(buyerInfo._id);
        setOverview(buyerInfo.company_overview_text ?? '');
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  const handleGenerateFromWebsite = async () => {
    if (!websiteUrl.trim()) return;
    setGenerating(true);
    setGenerateError('');
    try {
      const res = await fetch(`${getApiUrl()}/api/integrations/summarise-website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to generate summary');
      setOverview(json.summary);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveOverview = async () => {
    if (!buyerInfoId) return;
    setOverviewSaving(true);
    try {
      await updateBuyerInfo(buyerInfoId, { company_overview_text: overview });
      setOverviewSaved(true);
      setTimeout(() => setOverviewSaved(false), 2000);
    } catch {
      // fail silently — user can retry
    } finally {
      setOverviewSaving(false);
    }
  };

  return (
    <section className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 bg-white rounded-lg px-3 py-2">
            <img src={langcliffeLogo} alt="Langcliffe International" className="h-7 w-auto" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Langcliffe International Daily List</h2>
            <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
              Your advisor scores and responds to Langcliffe deal teasers on your behalf.
            </p>
          </div>
        </div>
        <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
          Available
        </span>
      </div>

      <p className="text-sm text-[var(--text-secondary)] mt-4 leading-relaxed">
        Langcliffe International sends a daily email listing businesses available for acquisition across the UK. Once set up, your advisor will automatically receive this list, score each opportunity against your criteria, and reach out to Langcliffe on your behalf, so you never miss a relevant deal.
      </p>

      <div className="mt-5 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => setInstructionsOpen((o) => !o)}
          className="w-full flex items-center justify-between py-3 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Setup instructions
          <ChevronDown size={15} className={`transition-transform duration-200 ${instructionsOpen ? 'rotate-180' : ''}`} />
        </button>

        {instructionsOpen && (
          <ol className="space-y-4 text-base text-[var(--text-secondary)] pb-2">
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
              <div className="flex-1 space-y-2">
                <p className="text-[var(--text-primary)] font-medium">Add your company overview</p>
                <p className="text-sm">Your advisor uses this to introduce your company when reaching out to brokers. Paste your website and let AI generate a summary, or write one yourself.</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourcompany.com"
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateFromWebsite}
                    disabled={generating || !websiteUrl.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    {generating ? 'Generating…' : 'Generate'}
                  </button>
                </div>
                {generateError && <p className="text-xs text-red-400">{generateError}</p>}
                <textarea
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  rows={4}
                  placeholder="Describe your company and acquisition focus…"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                />
                <button
                  type="button"
                  onClick={handleSaveOverview}
                  disabled={overviewSaving || !buyerInfoId}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-accent text-black hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {overviewSaving ? <Loader2 size={13} className="animate-spin" /> : overviewSaved ? <Check size={13} /> : null}
                  {overviewSaving ? 'Saving…' : overviewSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center mt-0.5">3</span>
              <div>
                <p className="text-[var(--text-primary)] font-medium">Set up email forwarding</p>
                <p className="mt-0.5">
                  In your email client, create a forwarding rule so that any email from{' '}
                  <span className="font-mono text-[var(--text-primary)] text-xs bg-[var(--bg-secondary)] px-1 py-0.5 rounded">@langcliffeinternational.com</span>{' '}
                  is automatically forwarded to your advisor's email address below.
                </p>
                <p className="mt-1.5 text-sm text-[var(--text-tertiary)]">
                  In Gmail: Settings, then See all settings, then Forwarding and POP/IMAP, then Add a forwarding address, then create a filter matching the sender domain.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center mt-0.5">4</span>
              <div>
                <p className="text-[var(--text-primary)] font-medium">Your advisor's email address</p>
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
                  <p className="mt-2 text-xs text-[var(--text-tertiary)] italic">Agent email not found. Check your Settings.</p>
                )}
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center mt-0.5">5</span>
              <div>
                <p className="text-[var(--text-primary)] font-medium">You're done</p>
                <p className="mt-0.5">
                  Once forwarding is active, your advisor will process each daily list automatically. If anything matches your criteria, they will reach out to Langcliffe and gather as much information as possible to make sure it is a strong fit before bringing it to your attention. Occasionally, Langcliffe may request an NDA before sharing further details. Your advisor will handle this too and notify you via email and on your dashboard if your signature is needed.
                </p>
              </div>
            </li>
          </ol>
        )}
      </div>
    </section>
  );
}

function DealsuiteCard() {
  return (
    <section className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 bg-white rounded-lg px-3 py-2">
            <img src={dealsuitelogo} alt="Dealsuite" className="h-7 w-auto" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Dealsuite</h2>
            <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
              Connect to Dealsuite's M&amp;A deal flow platform to discover and pursue additional acquisition opportunities.
            </p>
          </div>
        </div>
        <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border)] uppercase tracking-wider">
          Coming soon
        </span>
      </div>

      <p className="text-sm text-[var(--text-secondary)] mt-4 leading-relaxed">
        Dealsuite integration will allow your advisor to automatically browse and engage with deal flow from Dealsuite's authenticated platform, significantly expanding the range of opportunities they can pursue on your behalf.
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

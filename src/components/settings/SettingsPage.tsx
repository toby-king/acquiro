import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdvisorStore } from '../../hooks/useAdvisorStore';
import { cancelSubscription } from '../../services/checkoutService';
import { unsubscribeUser } from '../../services/userService';
import {
  getUserProfile,
  updateUserProfile,
  getMyAgent,
  updateAgent,
  getMyBuyerInfo,
  updateBuyerInfo,
  type AgentRecord,
  type BuyerInfoRecord,
} from '../../services/settingsService';
import { ArrowLeft, Loader2, Check, AlertCircle, Pencil, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Shared primitives ────────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function useSaveState(): [SaveState, (fn: () => Promise<void>) => Promise<void>] {
  const [state, setState] = useState<SaveState>('idle');
  const save = useCallback(async (fn: () => Promise<void>) => {
    setState('saving');
    try {
      await fn();
      setState('saved');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  }, []);
  return [state, save];
}

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-1 focus:ring-accent';
const textareaCls = `${inputCls} resize-none`;

/** Read-only field row */
function ReadField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-[var(--text-primary)]">{value || <span className="text-[var(--text-tertiary)] italic">Not set</span>}</p>
    </div>
  );
}

/** Wrapper card with pencil toggle */
function EditableCard({
  title,
  description,
  loading,
  editing,
  onEdit,
  onCancel,
  saveState,
  onSave,
  readContent,
  editContent,
}: {
  title: string;
  description?: string;
  loading?: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  saveState: SaveState;
  onSave: (e: React.FormEvent) => void;
  readContent: React.ReactNode;
  editContent: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
          {description && <p className="text-sm text-[var(--text-tertiary)] mt-0.5">{description}</p>}
        </div>
        {!loading && !editing && (
          <button
            type="button"
            onClick={onEdit}
            className="flex-shrink-0 p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label={`Edit ${title}`}
          >
            <Pencil size={15} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] py-2">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : editing ? (
        <form onSubmit={onSave} className="space-y-4">
          {editContent}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={saveState === 'saving'}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-4 py-2 rounded-full text-sm font-medium bg-accent text-black hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {saveState === 'saving' && <Loader2 size={13} className="animate-spin" />}
              {saveState === 'saved' && <Check size={13} />}
              {saveState === 'error' && <AlertCircle size={13} />}
              {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Error — retry' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saveState === 'saving'}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-4 py-2 rounded-full text-sm font-medium text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 transition-colors"
            >
              <X size={13} />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        readContent
      )}
    </section>
  );
}

// ─── Profile section ──────────────────────────────────────────────────────────

function ProfileSection({ userId }: { userId: string }) {
  const { userName, userEmail, setUserName } = useAdvisorStore();
  const [email, setEmail] = useState(userEmail ?? '');
  const [savedName, setSavedName] = useState(userName ?? '');
  const [draftName, setDraftName] = useState(userName ?? '');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saveState, save] = useSaveState();

  useEffect(() => {
    getUserProfile(userId)
      .then((p) => {
        const name = p.name_text ?? '';
        const em = p.email ?? userEmail ?? '';
        setSavedName(name);
        setDraftName(name);
        setEmail(em);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleEdit = () => { setDraftName(savedName); setEditing(true); };
  const handleCancel = () => { setDraftName(savedName); setEditing(false); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    save(async () => {
      await updateUserProfile(userId, { name_text: draftName.trim() });
      setSavedName(draftName.trim());
      setUserName(draftName.trim());
      setEditing(false);
    });
  };

  return (
    <EditableCard
      title="Profile"
      description="Your name and login email."
      loading={loading}
      editing={editing}
      onEdit={handleEdit}
      onCancel={handleCancel}
      saveState={saveState}
      onSave={handleSave}
      readContent={
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadField label="Name" value={savedName} />
          <div>
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Email</p>
            <p className="text-sm text-[var(--text-primary)]">{email || <span className="text-[var(--text-tertiary)] italic">Not set</span>}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Contact support to change your email.</p>
          </div>
        </div>
      }
      editContent={
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Name</label>
            <input className={inputCls} value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Email</label>
            <input className={inputCls} value={email} disabled title="Contact support to change your email" />
            <p className="text-xs text-[var(--text-tertiary)]">Contact support to change your email.</p>
          </div>
        </div>
      }
    />
  );
}

// ─── Agent section ────────────────────────────────────────────────────────────

function AgentSection({ userId }: { userId: string }) {
  const [agent, setAgent] = useState<AgentRecord | null>(null);
  const [saved, setSaved] = useState({ name_text: '', email_text: '' });
  const [draft, setDraft] = useState(saved);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saveState, save] = useSaveState();

  useEffect(() => {
    getMyAgent(userId)
      .then((a) => {
        if (a) {
          setAgent(a);
          const vals = { name_text: a.name_text ?? '', email_text: a.email_text ?? '' };
          setSaved(vals);
          setDraft(vals);
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleEdit = () => { setDraft(saved); setEditing(true); };
  const handleCancel = () => { setDraft(saved); setEditing(false); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;
    save(async () => {
      await updateAgent(agent._id, { name_text: draft.name_text.trim(), email_text: draft.email_text.trim() });
      const committed = { name_text: draft.name_text.trim(), email_text: draft.email_text.trim() };
      setSaved(committed);
      setEditing(false);
    });
  };

  return (
    <EditableCard
      title="Your Agent"
      description="The name and sending email your AI agent uses when reaching out on your behalf."
      loading={loading}
      editing={editing}
      onEdit={handleEdit}
      onCancel={handleCancel}
      saveState={saveState}
      onSave={handleSave}
      readContent={
        !agent ? (
          <p className="text-sm text-[var(--text-tertiary)]">No agent found for your account.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadField label="Agent name" value={saved.name_text} />
            <ReadField label="Agent email" value={saved.email_text} />
          </div>
        )
      }
      editContent={
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Agent name</label>
            <input className={inputCls} value={draft.name_text} onChange={(e) => setDraft((d) => ({ ...d, name_text: e.target.value }))} placeholder="e.g. Sophia" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Agent email</label>
            <input className={inputCls} type="email" value={draft.email_text} onChange={(e) => setDraft((d) => ({ ...d, email_text: e.target.value }))} placeholder="e.g. sophia@acquiro.ai" />
          </div>
        </div>
      }
    />
  );
}

// ─── Buyer criteria section ───────────────────────────────────────────────────

type BuyerDraft = {
  company_overview_text: string;
  geography_text: string;
  funding_source_text: string;
  ebitda_range_text: string;
  turnover_range_text: string;
  max_investment_number: string;
  industry_preferences: string;
  excluded_sectors: string;
};

function infoToDraft(b: BuyerInfoRecord): BuyerDraft {
  return {
    company_overview_text: b.company_overview_text ?? '',
    geography_text: b.geography_text ?? '',
    funding_source_text: b.funding_source_text ?? '',
    ebitda_range_text: b.ebitda_range_text ?? '',
    turnover_range_text: b.turnover_range_text ?? '',
    max_investment_number: b.max_investment_number != null ? String(b.max_investment_number) : '',
    industry_preferences: (b.industry_preferences_list_option_sectors ?? []).join(', '),
    excluded_sectors: (b.excluded_sectors_list_option_sectors ?? []).join(', '),
  };
}

const emptyDraft: BuyerDraft = {
  company_overview_text: '',
  geography_text: '',
  funding_source_text: '',
  ebitda_range_text: '',
  turnover_range_text: '',
  max_investment_number: '',
  industry_preferences: '',
  excluded_sectors: '',
};

function BuyerCriteriaSection({ userId }: { userId: string }) {
  const [info, setInfo] = useState<BuyerInfoRecord | null>(null);
  const [saved, setSaved] = useState<BuyerDraft>(emptyDraft);
  const [draft, setDraft] = useState<BuyerDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saveState, save] = useSaveState();

  useEffect(() => {
    getMyBuyerInfo(userId)
      .then((b) => {
        if (b) {
          setInfo(b);
          const d = infoToDraft(b);
          setSaved(d);
          setDraft(d);
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const set = (key: keyof BuyerDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  const handleEdit = () => { setDraft(saved); setEditing(true); };
  const handleCancel = () => { setDraft(saved); setEditing(false); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!info) return;
    const splitList = (s: string) => s.split(',').map((v) => v.trim()).filter(Boolean);
    save(async () => {
      await updateBuyerInfo(info._id, {
        company_overview_text: draft.company_overview_text.trim() || undefined,
        geography_text: draft.geography_text.trim() || undefined,
        funding_source_text: draft.funding_source_text.trim() || undefined,
        ebitda_range_text: draft.ebitda_range_text.trim() || undefined,
        turnover_range_text: draft.turnover_range_text.trim() || undefined,
        max_investment_number: draft.max_investment_number ? Number(draft.max_investment_number) : undefined,
        industry_preferences_list_option_sectors: splitList(draft.industry_preferences),
        excluded_sectors_list_option_sectors: splitList(draft.excluded_sectors),
      });
      setSaved(draft);
      setEditing(false);
    });
  };

  const LabelInput = ({ label, field, type = 'text', placeholder }: { label: string; field: keyof BuyerDraft; type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">{label}</label>
      <input className={inputCls} type={type} value={draft[field]} onChange={set(field)} placeholder={placeholder} />
    </div>
  );

  return (
    <EditableCard
      title="Buyer Criteria"
      description="Your acquisition preferences used to score and match opportunities."
      loading={loading}
      editing={editing}
      onEdit={handleEdit}
      onCancel={handleCancel}
      saveState={saveState}
      onSave={handleSave}
      readContent={
        !info ? (
          <p className="text-sm text-[var(--text-tertiary)]">No buyer criteria found for your account.</p>
        ) : (
          <div className="space-y-4">
            <ReadField label="Company overview" value={saved.company_overview_text} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReadField label="Geography" value={saved.geography_text} />
              <ReadField label="Funding source" value={saved.funding_source_text} />
              <ReadField label="EBITDA range" value={saved.ebitda_range_text} />
              <ReadField label="Turnover range" value={saved.turnover_range_text} />
              <ReadField label="Max investment" value={saved.max_investment_number ? `£${Number(saved.max_investment_number).toLocaleString()}` : ''} />
            </div>
            <ReadField label="Preferred sectors" value={saved.industry_preferences} />
            <ReadField label="Excluded sectors" value={saved.excluded_sectors} />
          </div>
        )
      }
      editContent={
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Company overview</label>
            <textarea className={textareaCls} rows={4} value={draft.company_overview_text} onChange={set('company_overview_text')} placeholder="Brief description of who you are and what you're looking to acquire…" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LabelInput label="Geography" field="geography_text" placeholder="e.g. UK" />
            <LabelInput label="Funding source" field="funding_source_text" placeholder="e.g. Cash / bank debt" />
            <LabelInput label="EBITDA range" field="ebitda_range_text" placeholder="e.g. £200k – £1m" />
            <LabelInput label="Turnover range" field="turnover_range_text" placeholder="e.g. £1m – £5m" />
            <LabelInput label="Max investment (£)" field="max_investment_number" type="number" placeholder="e.g. 2000000" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Preferred sectors (comma-separated)</label>
            <input className={inputCls} value={draft.industry_preferences} onChange={set('industry_preferences')} placeholder="e.g. Technology, Manufacturing, Healthcare" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Excluded sectors (comma-separated)</label>
            <input className={inputCls} value={draft.excluded_sectors} onChange={set('excluded_sectors')} placeholder="e.g. Hospitality, Retail" />
          </div>
        </div>
      }
    />
  );
}

// ─── Subscription section ─────────────────────────────────────────────────────

function SubscriptionSection() {
  const navigate = useNavigate();
  const { userId, isSubscribed, subscriptionId, cancelAt, setSubscriptionStatus } = useAdvisorStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const canCancel = Boolean(isSubscribed && subscriptionId && !cancelAt);
  const isCancelling = Boolean(isSubscribed && cancelAt);

  const handleConfirmCancel = async () => {
    if (!subscriptionId || !userId) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const data = await cancelSubscription(subscriptionId);
      const cancelAtIso = new Date(data.currentPeriodEnd * 1000).toISOString();
      try { await unsubscribeUser(userId, cancelAtIso); } catch { /* sync via webhook */ }
      setSubscriptionStatus(true, subscriptionId, cancelAtIso);
      setCancelling(false);
      setConfirmOpen(false);
      navigate('/dashboard', { replace: true });
    } catch {
      setCancelError('Something went wrong. Please try again.');
      setCancelling(false);
    }
  };

  return (
    <>
      <section className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Subscription</h2>
        {isCancelling ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-primary)]">
              Your subscription is cancelling and will end on{' '}
              <time dateTime={cancelAt ?? undefined}>
                {cancelAt ? new Date(cancelAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
              </time>.
            </p>
            <Link to="/offer" className="inline-flex min-h-[40px] items-center px-5 py-2 rounded-full text-sm font-medium bg-accent text-black hover:bg-accent/90 transition-colors">
              Resubscribe
            </Link>
          </div>
        ) : isSubscribed ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" aria-hidden />
              <span className="text-sm text-[var(--text-primary)]">Active</span>
            </div>
            {canCancel && (
              <button type="button" onClick={() => { setCancelError(null); setConfirmOpen(true); }} className="min-h-[40px] px-5 py-2 rounded-full text-sm font-medium bg-red-600/90 text-white hover:bg-red-600 transition-colors">
                Cancel subscription
              </button>
            )}
            {isSubscribed && !subscriptionId && (
              <p className="text-sm text-[var(--text-secondary)]">Unable to manage subscription. Please contact support.</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">
            You are not currently subscribed.{' '}
            <Link to="/offer" className="text-accent hover:underline">Subscribe</Link> to get full access.
          </p>
        )}
      </section>

      <AnimatePresence>
        {confirmOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmOpen(false)} aria-hidden />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="pointer-events-auto w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-xl p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Cancel subscription?</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
                  You'll lose access to your matched listings, advisor, and email alerts at the end of your current billing period.
                </p>
                {cancelError && <p className="text-red-500 text-sm mb-4">{cancelError}</p>}
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <button type="button" onClick={() => setConfirmOpen(false)} disabled={cancelling} className="min-h-[44px] px-5 py-2.5 rounded-full font-medium text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors disabled:opacity-50">
                    Keep subscription
                  </button>
                  <button type="button" onClick={handleConfirmCancel} disabled={cancelling} className="min-h-[44px] px-5 py-2.5 rounded-full font-medium bg-red-600/90 text-white hover:bg-red-600 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2">
                    {cancelling ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling…</> : 'Cancel subscription'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { userId } = useAdvisorStore();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <header className="w-full px-4 sm:px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="font-display font-bold text-xl text-[var(--text-primary)]">Settings</h1>
        <div className="w-[120px]" aria-hidden />
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6">
        {userId ? (
          <>
            <ProfileSection userId={userId} />
            <AgentSection userId={userId} />
            <BuyerCriteriaSection userId={userId} />
            <SubscriptionSection />
          </>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">Please log in to manage your settings.</p>
        )}
      </main>
    </div>
  );
}

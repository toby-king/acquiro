import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Loader2, Mail, ChevronDown, ChevronUp, Trash2, ExternalLink } from 'lucide-react';
import {
  getLangcliffeQueue,
  approveOutreach,
  approveReply,
  approveAcknowledgment,
  approveNDAReturn,
  rejectOutreach,
  rejectReply,
  deleteOutreach,
  type OutreachDraft,
} from '../../services/langcliffeService';

// ─── Types ────────────────────────────────────────────────────────────────────

type CardAction = 'idle' | 'approving' | 'rejecting' | 'rewriting' | 'deleting';

// ─── Draft card ───────────────────────────────────────────────────────────────

function DraftCard({
  draft,
  onActionComplete,
}: {
  draft: OutreachDraft;
  onActionComplete: () => void;
}) {
  const isReply    = draft.status_text === 'pending_reply';
  const isNdaAck   = draft.status_text === 'nda_received';
  const isNdaReturn = draft.status_text === 'nda_signed';
  const isNdaCard  = isNdaAck || isNdaReturn;

  const [action, setAction]             = useState<CardAction>('idle');
  const [feedback, setFeedback]         = useState('');
  const [showReject, setShowReject]     = useState(false);
  const [showDelete, setShowDelete]     = useState(false);
  const [expanded, setExpanded]         = useState(false);
  const [currentDraft, setCurrentDraft] = useState(() => {
    if (isNdaAck)    return draft.acknowledgment_draft_text ?? '';
    if (isNdaReturn) return draft.nda_return_draft_text ?? '';
    if (isReply)     return draft.reply_draft_text ?? '';
    return draft.draft_body_text;
  });
  const [error, setError]               = useState<string | null>(null);

  const busy = action !== 'idle';

  const handleApprove = async () => {
    setError(null);
    setAction('approving');
    try {
      if (isNdaAck)    await approveAcknowledgment(draft._id);
      else if (isNdaReturn) await approveNDAReturn(draft._id);
      else if (isReply)     await approveReply(draft._id);
      else                  await approveOutreach(draft._id);
      onActionComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed');
      setAction('idle');
    }
  };

  const handleDelete = async () => {
    setError(null);
    setAction('deleting');
    try {
      await deleteOutreach(draft._id);
      onActionComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setAction('idle');
    }
  };

  const handleReject = async () => {
    setError(null);
    setAction('rewriting');
    try {
      const newDraft = isReply
        ? await rejectReply(draft._id, feedback || undefined)
        : await rejectOutreach(draft._id, feedback || undefined);
      setCurrentDraft(newDraft);
      setFeedback('');
      setShowReject(false);
      setAction('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rewrite failed');
      setAction('idle');
    }
  };

  const ref = draft.listing_id_text.replace('langcliffe_', '').replace('langcliffe-', '');
  const createdAt = new Date(draft['Created Date']).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'numeric', year: '2-digit',
  });

  const borderClass = isNdaCard
    ? isNdaAck ? 'border-purple-500/30' : 'border-green-500/30'
    : isReply ? 'border-blue-500/30' : 'border-[var(--border)]';

  const approveLabel = isNdaAck
    ? 'Approve & Send Acknowledgment'
    : isNdaReturn
    ? 'Send NDA to Langcliffe'
    : isReply
    ? 'Approve & Send Reply'
    : 'Approve & Send';

  return (
    <div className={`rounded-xl bg-[var(--bg-card)] border overflow-hidden ${borderClass}`}>
      {/* Card header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-[var(--border)]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-[var(--text-primary)] truncate">
              {draft.business_name_text}
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-medium flex-shrink-0">
              Ref {ref}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[var(--text-tertiary)]">
            <Mail size={11} />
            <span>{draft.langcliffe_contact_text}</span>
            <span className="mx-1">·</span>
            <span>{createdAt}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex-shrink-0 p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <>
          {/* Initial outreach: show original Langcliffe teaser */}
          {!isReply && !isNdaCard && draft.inbound_email_text && (
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                Original email
              </p>
              <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] font-sans leading-relaxed bg-[var(--bg-secondary)] rounded-lg p-4 max-h-64 overflow-y-auto">
                {draft.inbound_email_text}
              </pre>
            </div>
          )}

          {/* Reply: show Langcliffe's message */}
          {isReply && draft.langcliffe_reply_body_text && (
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <p className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-2">
                Langcliffe's message
              </p>
              <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] font-sans leading-relaxed bg-[var(--bg-secondary)] rounded-lg p-4 max-h-64 overflow-y-auto">
                {draft.langcliffe_reply_body_text}
              </pre>
            </div>
          )}

          {/* NDA received: show NDA download link */}
          {isNdaAck && draft.nda_file_text && (
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <p className="text-xs font-medium text-purple-400 uppercase tracking-wider mb-2">
                NDA from Langcliffe
              </p>
              <a
                href={draft.nda_file_text}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
              >
                <ExternalLink size={12} />
                Download NDA
              </a>
            </div>
          )}

          {/* NDA signed: show signed NDA download link */}
          {isNdaReturn && draft.signed_nda_file_text && (
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <p className="text-xs font-medium text-green-400 uppercase tracking-wider mb-2">
                Signed NDA from user
              </p>
              <a
                href={draft.signed_nda_file_text}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
              >
                <ExternalLink size={12} />
                Download signed NDA
              </a>
            </div>
          )}

          {/* Draft body */}
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
              {isNdaAck ? 'Acknowledgment draft' : isNdaReturn ? 'NDA return email draft' : isReply ? 'Draft reply' : 'Draft email body'}
            </p>
            <pre className="whitespace-pre-wrap text-sm text-[var(--text-primary)] font-sans leading-relaxed bg-[var(--bg-secondary)] rounded-lg p-4">
              {currentDraft}
            </pre>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="px-5 py-3 flex flex-col gap-3">
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {/* Approve */}
          <button
            type="button"
            onClick={handleApprove}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-accent text-black hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {action === 'approving' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            {action === 'approving' ? 'Sending…' : approveLabel}
          </button>

          {/* Reject / rewrite — not applicable to NDA cards */}
          {!isNdaCard && (
            <button
              type="button"
              onClick={() => setShowReject((s) => !s)}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-card)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XCircle size={14} />
              Reject & Rewrite
            </button>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={() => setShowDelete((s) => !s)}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-tertiary)] hover:text-red-400 hover:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {action === 'deleting' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Delete
          </button>

          {action === 'rewriting' && (
            <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" /> Regenerating…
            </span>
          )}
        </div>

        {/* Delete confirmation panel */}
        {showDelete && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 space-y-2">
            <p className="text-xs text-red-400 font-medium">
              Warning: this will permanently delete the draft and stop any conversation with Langcliffe about this opportunity.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {action === 'deleting' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Confirm delete
              </button>
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                disabled={busy}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reject feedback panel */}
        {showReject && (
          <div className="space-y-2">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional feedback for the rewrite (e.g. 'Make it shorter and mention our sector experience')"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
            <button
              type="button"
              onClick={handleReject}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {action === 'rewriting' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <XCircle size={14} />
              )}
              Confirm reject & rewrite
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function QueueSection({
  title,
  description,
  color,
  items,
  onActionComplete,
}: {
  title: string;
  description: string;
  color: string;
  items: OutreachDraft[];
  onActionComplete: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-sm font-semibold ${color}`}>{title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            color === 'text-amber-400'  ? 'bg-amber-400/10 text-amber-400'   :
            color === 'text-blue-400'   ? 'bg-blue-400/10 text-blue-400'     :
            color === 'text-purple-400' ? 'bg-purple-400/10 text-purple-400' :
                                          'bg-green-400/10 text-green-400'
          }`}>
            {items.length}
          </span>
          <span className="text-xs text-[var(--text-tertiary)] hidden sm:block">{description}</span>
        </div>
        {open ? <ChevronUp size={15} className="text-[var(--text-tertiary)] flex-shrink-0" /> : <ChevronDown size={15} className="text-[var(--text-tertiary)] flex-shrink-0" />}
      </button>

      {/* Cards */}
      {open && (
        <div className="p-4 space-y-4 bg-[var(--bg-primary)]">
          {items.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)] text-center py-4">No items in this section.</p>
          ) : (
            items.map((draft) => (
              <DraftCard key={draft._id} draft={draft} onActionComplete={onActionComplete} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab root ─────────────────────────────────────────────────────────────────

const SECTIONS: {
  key: OutreachDraft['status_text'];
  title: string;
  description: string;
  color: string;
}[] = [
  { key: 'pending_reply', title: 'Replies',      description: 'Responses from Langcliffe contacts',          color: 'text-blue-400'   },
  { key: 'pending',       title: 'Teasers',      description: 'Initial outreach drafts awaiting approval',   color: 'text-amber-400'  },
  { key: 'nda_received',  title: 'NDAs Received', description: 'Acknowledgment drafts awaiting approval',    color: 'text-purple-400' },
  { key: 'nda_signed',    title: 'NDAs Signed',   description: 'NDA return emails awaiting approval',        color: 'text-green-400'  },
];

export function AdminLangcliffeTab({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const [queue, setQueue]     = useState<OutreachDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const data = await getLangcliffeQueue();
      setQueue((prev) => {
        const prevIds = prev.map((d) => d._id).join(',');
        const nextIds = data.map((d) => d._id).join(',');
        return prevIds === nextIds ? prev : data;
      });
      onCountChange?.(data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    load(true);
    const interval = setInterval(() => { if (!document.hidden) load(); }, 30_000);
    const handleVisibility = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [load]);

  const totalPending = queue.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Langcliffe Outreach Queue</h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Review AI-generated draft emails before they are sent to Langcliffe contacts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading}
          className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-[var(--border)] transition-colors disabled:opacity-50"
          aria-label="Refresh queue"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
          <Loader2 size={14} className="animate-spin" />
          Loading queue…
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && totalPending === 0 && (
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] px-5 py-10 text-center">
          <p className="text-[var(--text-secondary)] text-sm">No pending outreach drafts.</p>
          <p className="text-[var(--text-tertiary)] text-xs mt-1">
            Drafts appear here when a forwarded Langcliffe teaser matches a subscriber's criteria.
          </p>
        </div>
      )}

      {!loading && totalPending > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-tertiary)]">
            {totalPending} item{totalPending !== 1 ? 's' : ''} pending approval
          </p>
          {SECTIONS.map((section) => {
            const items = queue.filter((d) => d.status_text === section.key);
            if (items.length === 0) return null;
            return (
              <QueueSection
                key={section.key}
                title={section.title}
                description={section.description}
                color={section.color}
                items={items}
                onActionComplete={load}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getPursueRequests,
  markContacted,
  markResponded,
  markClosed,
  updateNotes,
  type PursueRequest,
} from '../../services/pursueService';

const STATUS_LABELS: Record<PursueRequest['status_text'], string> = {
  pending:   'Pending',
  contacted: 'Contacted',
  responded: 'Responded',
  closed:    'Closed',
};

const STATUS_COLOURS: Record<PursueRequest['status_text'], string> = {
  pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  contacted: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  responded: 'bg-green-500/15 text-green-400 border-green-500/30',
  closed:    'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border)]',
};

function PursueCard({
  request,
  onUpdate,
}: {
  request: PursueRequest;
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(request.admin_notes_text ?? '');
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createdAt = new Date(request['Created Date']).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const handleAction = async (fn: () => Promise<void>) => {
    setError(null);
    setActionBusy(true);
    try {
      await fn();
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
      setActionBusy(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await updateNotes(request._id, notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (n: number | null | undefined) =>
    n != null ? `£${n.toLocaleString()}` : null;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header — clickable to expand/collapse */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left hover:bg-[var(--bg-secondary)] transition-colors"
        aria-label={expanded ? 'Collapse' : 'Expand'}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--text-primary)] text-sm truncate">
              {request.business_name_text || 'Unknown Business'}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOURS[request.status_text]}`}>
              {STATUS_LABELS[request.status_text]}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-[var(--text-tertiary)] flex-wrap">
            {request.user_name_text && (
              <span className="font-medium text-[var(--text-secondary)]">{request.user_name_text}</span>
            )}
            {request.user_email_text && (
              <span className="text-[var(--text-tertiary)]">({request.user_email_text})</span>
            )}
            {(request.user_name_text || request.user_email_text) && <span className="mx-0.5">·</span>}
            <span>{createdAt}</span>
          </div>
        </div>
        <span className="flex-shrink-0 p-1.5 text-[var(--text-tertiary)]">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-[var(--border)]">
          {/* Business overview */}
          {(request.business_description_text || request.business_sector_text) && (
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Business overview</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)] mb-2">
                {request.business_sector_text && <span>Sector: {request.business_sector_text}</span>}
                {request.business_location_text && <span>Location: {request.business_location_text}</span>}
                {formatCurrency(request.business_asking_price_number) && <span>Asking: {formatCurrency(request.business_asking_price_number)}</span>}
                {formatCurrency(request.business_turnover_number) && <span>Turnover: {formatCurrency(request.business_turnover_number)}</span>}
                {formatCurrency(request.business_net_profit_number) && <span>Net profit: {formatCurrency(request.business_net_profit_number)}</span>}
              </div>
              {request.business_description_text && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-4">
                  {request.business_description_text}
                </p>
              )}
            </div>
          )}

          {/* Listing link */}
          {request.listing_url_text && (
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <a
                href={request.listing_url_text}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
              >
                <ExternalLink size={12} />
                View original listing
              </a>
            </div>
          )}

          {/* Notes */}
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider block mb-2">Admin notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] resize-none focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Add notes about this outreach..."
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={saving}
              className="mt-1.5 text-xs px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save notes'}
            </button>
          </div>

          {/* Status actions */}
          <div className="px-5 py-3 flex flex-wrap items-center gap-2">
            {request.status_text === 'pending' && (
              <button
                type="button"
                onClick={() => handleAction(() => markContacted(request._id))}
                disabled={actionBusy}
                className="text-xs px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
              >
                {actionBusy ? <Loader2 size={12} className="animate-spin" /> : 'Mark as contacted'}
              </button>
            )}
            {request.status_text === 'contacted' && (
              <button
                type="button"
                onClick={() => handleAction(() => markResponded(request._id))}
                disabled={actionBusy}
                className="text-xs px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
              >
                {actionBusy ? <Loader2 size={12} className="animate-spin" /> : 'Mark as responded'}
              </button>
            )}
            {request.status_text !== 'closed' && (
              <button
                type="button"
                onClick={() => handleAction(() => markClosed(request._id))}
                disabled={actionBusy}
                className="text-xs px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
              >
                Close
              </button>
            )}
          </div>

          {error && <p className="text-xs text-red-400 px-5 pb-3">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function AdminPursueTab({ onCountChange }: { onCountChange?: (n: number) => void }) {
  const [requests, setRequests] = useState<PursueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PursueRequest['status_text'] | 'all'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPursueRequests();
      setRequests(data);
      const pendingCount = data.filter((r) => r.status_text === 'pending' || r.status_text === 'contacted').length;
      onCountChange?.(pendingCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status_text === filter);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {(['all', 'pending', 'contacted', 'responded', 'closed'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors capitalize ${
                filter === f
                  ? 'bg-accent text-black'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {f === 'all' ? `All (${requests.length})` : `${STATUS_LABELS[f]} (${requests.filter(r => r.status_text === f).length})`}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--text-secondary)]" />
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-sm text-[var(--text-secondary)] py-8 text-center">No pursue requests{filter !== 'all' ? ` with status "${filter}"` : ''}.</p>
      )}
      {!loading && filtered.map((r) => (
        <PursueCard key={r._id} request={r} onUpdate={load} />
      ))}
    </div>
  );
}

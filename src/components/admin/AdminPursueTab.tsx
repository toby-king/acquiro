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

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--text-primary)] text-sm truncate">
              {request.business_name_text || 'Unknown Business'}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOURS[request.status_text]}`}>
              {STATUS_LABELS[request.status_text]}
            </span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{createdAt}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {request.listing_url_text && (
            <a
              href={request.listing_url_text}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-accent hover:bg-[var(--bg-secondary)] transition-colors"
              title="View listing"
            >
              <ExternalLink size={15} />
            </a>
          )}
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--border)] pt-3 space-y-3">
          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Admin notes</label>
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
              className="mt-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save notes'}
            </button>
          </div>

          {/* Status actions */}
          <div className="flex flex-wrap gap-2">
            {request.status_text === 'pending' && (
              <button
                type="button"
                onClick={() => handleAction(() => markContacted(request._id))}
                disabled={actionBusy}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
              >
                {actionBusy ? <Loader2 size={12} className="animate-spin" /> : 'Mark as contacted'}
              </button>
            )}
            {request.status_text === 'contacted' && (
              <button
                type="button"
                onClick={() => handleAction(() => markResponded(request._id))}
                disabled={actionBusy}
                className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
              >
                {actionBusy ? <Loader2 size={12} className="animate-spin" /> : 'Mark as responded'}
              </button>
            )}
            {request.status_text !== 'closed' && (
              <button
                type="button"
                onClick={() => handleAction(() => markClosed(request._id))}
                disabled={actionBusy}
                className="text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
              >
                Close
              </button>
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
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
    <div className="space-y-4 max-w-3xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1">
          {(['all', 'pending', 'contacted', 'responded', 'closed'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
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

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, Plus, ChevronDown, ChevronUp, Eye, EyeOff, BarChart3 } from 'lucide-react';
import {
  getFeatureAnnouncements,
  createFeatureAnnouncement,
  updateFeatureAnnouncement,
  getFeatureImpressionStats,
  type FeatureAnnouncement,
  type FeatureImpressionStats,
} from '../../services/featureAnnouncementService';

function AnnouncementCard({
  announcement,
  onUpdate,
}: {
  announcement: FeatureAnnouncement;
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [stats, setStats] = useState<FeatureImpressionStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createdAt = new Date(announcement['Created Date']).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const handleToggleActive = async () => {
    setError(null);
    setToggling(true);
    try {
      await updateFeatureAnnouncement(announcement._id, {
        active_boolean: !announcement.active_boolean,
      });
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toggle failed');
    } finally {
      setToggling(false);
    }
  };

  const loadStats = async () => {
    if (stats) return; // already loaded
    setLoadingStats(true);
    try {
      const data = await getFeatureImpressionStats(announcement._id);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (expanded) loadStats();
  }, [expanded]);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--text-primary)] text-sm truncate">
              {announcement.name_text}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              announcement.active_boolean
                ? 'bg-green-500/15 text-green-400 border-green-500/30'
                : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border)]'
            }`}>
              {announcement.active_boolean ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{createdAt}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
            {announcement.headline_text}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={toggling}
            className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50"
            title={announcement.active_boolean ? 'Deactivate' : 'Activate'}
          >
            {toggling ? <Loader2 size={15} className="animate-spin" /> : announcement.active_boolean ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
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
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[var(--text-tertiary)]">CTA:</span>{' '}
              <span className="text-[var(--text-secondary)]">{announcement.cta_text || '—'}</span>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)]">Max impressions:</span>{' '}
              <span className="text-[var(--text-secondary)]">{announcement.max_impressions_number ?? 3}</span>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)]">Completion field:</span>{' '}
              <span className="text-[var(--text-secondary)] font-mono">{announcement.completion_field_text || '—'}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs">
            <BarChart3 size={14} className="text-[var(--text-tertiary)]" />
            {loadingStats ? (
              <Loader2 size={12} className="animate-spin text-[var(--text-tertiary)]" />
            ) : stats ? (
              <span className="text-[var(--text-secondary)]">
                {stats.uniqueUsers} user{stats.uniqueUsers !== 1 ? 's' : ''} reached, {stats.totalImpressions} total impression{stats.totalImpressions !== 1 ? 's' : ''}
              </span>
            ) : null}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}

function CreateAnnouncementForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name_text: '',
    headline_text: '',
    cta_text: '',
    max_impressions_number: 3,
    completion_field_text: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name_text.trim() || !form.headline_text.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createFeatureAnnouncement({
        ...form,
        active_boolean: false,
      });
      setForm({ name_text: '', headline_text: '', cta_text: '', max_impressions_number: 3, completion_field_text: '' });
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full bg-accent text-black hover:opacity-90 transition-opacity"
      >
        <Plus size={14} />
        New announcement
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Internal name</label>
          <input
            type="text"
            value={form.name_text}
            onChange={(e) => setForm((f) => ({ ...f, name_text: e.target.value }))}
            className="w-full text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="e.g. langcliffe_connect"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Completion field (User)</label>
          <input
            type="text"
            value={form.completion_field_text}
            onChange={(e) => setForm((f) => ({ ...f, completion_field_text: e.target.value }))}
            className="w-full text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="e.g. langcliffe_connected_boolean"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Headline (what the agent tells users)</label>
        <textarea
          value={form.headline_text}
          onChange={(e) => setForm((f) => ({ ...f, headline_text: e.target.value }))}
          rows={2}
          className="w-full text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] resize-none focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="e.g. Acquiro now connects to Langcliffe International's deal flow"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">CTA</label>
          <input
            type="text"
            value={form.cta_text}
            onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))}
            className="w-full text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="e.g. Head to Settings > Integrations to connect"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Max impressions</label>
          <input
            type="number"
            value={form.max_impressions_number}
            onChange={(e) => setForm((f) => ({ ...f, max_impressions_number: parseInt(e.target.value) || 3 }))}
            min={1}
            max={10}
            className="w-full text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-accent text-black hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}

export function AdminFeaturesTab() {
  const [announcements, setAnnouncements] = useState<FeatureAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFeatureAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <CreateAnnouncementForm onCreated={load} />
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50"
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
      {!loading && !error && announcements.length === 0 && (
        <p className="text-sm text-[var(--text-secondary)] py-8 text-center">No feature announcements yet.</p>
      )}
      {!loading && announcements.map((a) => (
        <AnnouncementCard key={a._id} announcement={a} onUpdate={load} />
      ))}
    </div>
  );
}

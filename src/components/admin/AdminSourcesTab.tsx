import { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

type ScraperStatus = 'idle' | 'running' | 'error';

interface ScraperSource {
  id: string;
  name: string;
  url: string;
  status: ScraperStatus;
  enabled: boolean;
  lastRun: string;
  nextRunInHours: number;
  recordsAdded: number;
  recordsArchived: number;
}

const DUMMY_SOURCES: ScraperSource[] = [
  {
    id: 'daltons',
    name: 'Daltons Business',
    url: 'daltonsbusiness.com',
    status: 'idle',
    enabled: true,
    lastRun: '2026-03-04T06:00:00Z',
    nextRunInHours: 2,
    recordsAdded: 143,
    recordsArchived: 31,
  },
  {
    id: 'businessesforsale',
    name: 'BusinessesForSale.com',
    url: 'businessesforsale.com',
    status: 'idle',
    enabled: true,
    lastRun: '2026-03-04T06:15:00Z',
    nextRunInHours: 3,
    recordsAdded: 87,
    recordsArchived: 14,
  },
  {
    id: 'christie',
    name: 'Christie & Co',
    url: 'christie.com',
    status: 'running',
    enabled: true,
    lastRun: '2026-03-04T07:30:00Z',
    nextRunInHours: 0,
    recordsAdded: 22,
    recordsArchived: 5,
  },
  {
    id: 'rightmove',
    name: 'Rightmove Commercial',
    url: 'rightmove.co.uk',
    status: 'idle',
    enabled: true,
    lastRun: '2026-03-04T05:45:00Z',
    nextRunInHours: 5,
    recordsAdded: 211,
    recordsArchived: 68,
  },
  {
    id: 'businessforsale',
    name: 'BusinessForSale.com',
    url: 'businessforsale.com',
    status: 'error',
    enabled: true,
    lastRun: '2026-03-03T06:00:00Z',
    nextRunInHours: 0,
    recordsAdded: 0,
    recordsArchived: 0,
  },
  {
    id: 'fleximize',
    name: 'Fleximize Marketplace',
    url: 'fleximize.com',
    status: 'idle',
    enabled: false,
    lastRun: '2026-03-01T06:00:00Z',
    nextRunInHours: 0,
    recordsAdded: 9,
    recordsArchived: 3,
  },
  {
    id: 'zoopla',
    name: 'Zoopla Commercial',
    url: 'zoopla.co.uk',
    status: 'idle',
    enabled: false,
    lastRun: '2026-03-02T06:00:00Z',
    nextRunInHours: 0,
    recordsAdded: 34,
    recordsArchived: 11,
  },
];

function StatusBadge({ status }: { status: ScraperStatus }) {
  if (status === 'running') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
        <RefreshCw size={11} className="animate-spin" />
        Running
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
        <AlertCircle size={11} />
        Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
      <CheckCircle2 size={11} />
      Idle
    </span>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] ${
        enabled ? 'bg-accent' : 'bg-[var(--border)]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function formatLastRun(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

function formatNextRun(enabled: boolean, status: ScraperStatus, hoursUntil: number): string {
  if (!enabled) return '—';
  if (status === 'running') return 'Now';
  if (status === 'error') return 'Paused (error)';
  if (hoursUntil <= 0) return '< 1 hour';
  return `in ~${hoursUntil}h`;
}

export function AdminSourcesTab() {
  const [sources, setSources] = useState<ScraperSource[]>(DUMMY_SOURCES);

  const toggleSource = (id: string, enabled: boolean) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled } : s))
    );
  };

  const activeCount = sources.filter((s) => s.enabled).length;
  const totalAdded = sources.filter((s) => s.enabled).reduce((sum, s) => sum + s.recordsAdded, 0);
  const totalArchived = sources.filter((s) => s.enabled).reduce((sum, s) => sum + s.recordsArchived, 0);
  const errorCount = sources.filter((s) => s.enabled && s.status === 'error').length;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Sources</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
          <p className="text-[var(--text-secondary)] text-sm">Active scrapers</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{activeCount} / {sources.length}</p>
        </div>
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
          <p className="text-[var(--text-secondary)] text-sm">Records added (last run)</p>
          <p className="text-2xl font-bold text-accent mt-1">+{totalAdded.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
          <p className="text-[var(--text-secondary)] text-sm">Records archived (last run)</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{totalArchived.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
          <p className="text-[var(--text-secondary)] text-sm">Sources with errors</p>
          <p className={`text-2xl font-bold mt-1 ${errorCount > 0 ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
            {errorCount}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="text-left p-3 font-medium text-[var(--text-primary)]">Source</th>
                <th className="text-left p-3 font-medium text-[var(--text-primary)]">Status</th>
                <th className="text-left p-3 font-medium text-[var(--text-primary)]">Last run</th>
                <th className="text-left p-3 font-medium text-[var(--text-primary)]">Next run</th>
                <th className="text-right p-3 font-medium text-[var(--text-primary)]">Added</th>
                <th className="text-right p-3 font-medium text-[var(--text-primary)]">Archived</th>
                <th className="text-center p-3 font-medium text-[var(--text-primary)]">Enabled</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr
                  key={source.id}
                  className={`border-b border-[var(--border)] transition-colors ${
                    source.enabled ? '' : 'opacity-50'
                  }`}
                >
                  <td className="p-3">
                    <p className="font-medium text-[var(--text-primary)]">{source.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{source.url}</p>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={source.enabled ? source.status : 'idle'} />
                  </td>
                  <td className="p-3 text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={12} className="text-[var(--text-tertiary)]" />
                      {formatLastRun(source.lastRun)}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--text-secondary)]">
                    {formatNextRun(source.enabled, source.status, source.nextRunInHours)}
                  </td>
                  <td className="p-3 text-right">
                    {source.recordsAdded > 0 ? (
                      <span className="text-accent font-medium">+{source.recordsAdded.toLocaleString()}</span>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right text-[var(--text-secondary)]">
                    {source.recordsArchived > 0 ? source.recordsArchived.toLocaleString() : <span className="text-[var(--text-tertiary)]">—</span>}
                  </td>
                  <td className="p-3 flex justify-center">
                    <Toggle
                      enabled={source.enabled}
                      onChange={(v) => toggleSource(source.id, v)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[var(--text-tertiary)]">
        Scrapers run automatically every 24 hours. Toggling a scraper off will prevent it from running on the next scheduled cycle.
      </p>
    </div>
  );
}

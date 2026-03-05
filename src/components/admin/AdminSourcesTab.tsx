import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Play, Zap, Users, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import {
  getSchedulerStatus,
  setSchedulerEnabled,
  runPipeline,
  runScrape,
  runMatches,
  scrapeSource,
  type SchedulerStatus,
  type SourceKey,
} from '../../services/scraperService';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionStatus = 'idle' | 'loading' | 'success' | 'error';

interface SourceDef {
  key: SourceKey;
  label: string;
  url: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCES: SourceDef[] = [
  { key: 'rightbiz',          label: 'Rightbiz',            url: 'rightbiz.co.uk' },
  { key: 'cogogo',            label: 'CoGoGo',              url: 'cogogo.com' },
  { key: 'daltons',           label: 'Daltons Business',    url: 'daltonsbusiness.com' },
  { key: 'businessesforsale', label: 'BusinessesForSale',   url: 'businessesforsale.com' },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed ${
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

function StatusDot({ status }: { status: ActionStatus }) {
  if (status === 'loading') return <Loader2 size={14} className="animate-spin text-accent" />;
  if (status === 'success') return <CheckCircle2 size={14} className="text-green-400" />;
  if (status === 'error')   return <AlertCircle  size={14} className="text-red-400" />;
  return null;
}

function ActionButton({
  onClick,
  status,
  icon: Icon,
  label,
  variant = 'secondary',
}: {
  onClick: () => void;
  status: ActionStatus;
  icon: React.ElementType;
  label: string;
  variant?: 'primary' | 'secondary';
}) {
  const base =
    'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const styles =
    variant === 'primary'
      ? 'bg-accent text-black hover:bg-accent/90'
      : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-card)]';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status === 'loading'}
      className={`${base} ${styles}`}
    >
      {status === 'loading' ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Icon size={15} />
      )}
      {label}
    </button>
  );
}

function useActionStatus(durationMs = 3000) {
  const [status, setStatus] = useState<ActionStatus>('idle');

  const run = useCallback(async (fn: () => Promise<void>) => {
    setStatus('loading');
    try {
      await fn();
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      setTimeout(() => setStatus('idle'), durationMs);
    }
  }, [durationMs]);

  return { status, run };
}

// ─── Scheduler card ───────────────────────────────────────────────────────────

function SchedulerCard() {
  const [info, setInfo]       = useState<SchedulerStatus | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [toggling, setToggling]     = useState(false);

  const load = useCallback(async () => {
    try {
      setFetchError(false);
      const s = await getSchedulerStatus();
      setInfo(s);
    } catch {
      setFetchError(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (enabled: boolean) => {
    if (!info) return;
    setToggling(true);
    try {
      await setSchedulerEnabled(enabled);
      setInfo((prev) => prev ? { ...prev, schedulerEnabled: enabled } : prev);
    } catch {
      // no-op — keep previous state
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--text-primary)]">Daily scheduler</p>
        {fetchError ? (
          <p className="text-xs text-red-400 mt-1">Could not reach scraper server</p>
        ) : !info ? (
          <p className="text-xs text-[var(--text-tertiary)] mt-1 flex items-center gap-1.5">
            <Loader2 size={11} className="animate-spin" /> Fetching status…
          </p>
        ) : (
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            <span className="font-mono">{info.cronExpression}</span>
            {' · '}{info.timezone}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {info && (
          <span className={`text-sm font-medium ${info.schedulerEnabled ? 'text-accent' : 'text-[var(--text-tertiary)]'}`}>
            {info.schedulerEnabled ? 'Enabled' : 'Disabled'}
          </span>
        )}
        <Toggle
          enabled={info?.schedulerEnabled ?? false}
          onChange={handleToggle}
          disabled={!info || toggling}
        />
        <button
          type="button"
          onClick={load}
          className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label="Refresh status"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Pipeline controls ────────────────────────────────────────────────────────

function PipelineControls() {
  const pipeline = useActionStatus();
  const scrape   = useActionStatus();
  const matches  = useActionStatus();

  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-5 space-y-4">
      <div>
        <p className="font-semibold text-[var(--text-primary)]">Manual triggers</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          All jobs run in the background — the server responds immediately.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ActionButton
            onClick={() => pipeline.run(runPipeline)}
            status={pipeline.status}
            icon={Zap}
            label="Run full pipeline"
            variant="primary"
          />
          <StatusDot status={pipeline.status} />
        </div>

        <div className="flex items-center gap-2">
          <ActionButton
            onClick={() => scrape.run(runScrape)}
            status={scrape.status}
            icon={Play}
            label="Scrape only"
          />
          <StatusDot status={scrape.status} />
        </div>

        <div className="flex items-center gap-2">
          <ActionButton
            onClick={() => matches.run(runMatches)}
            status={matches.status}
            icon={Users}
            label="Match only"
          />
          <StatusDot status={matches.status} />
        </div>
      </div>
    </div>
  );
}

// ─── Per-source controls ──────────────────────────────────────────────────────

function SourceRow({ source }: { source: SourceDef }) {
  const { status, run } = useActionStatus();
  const [pages, setPages] = useState(5);

  return (
    <tr className="border-b border-[var(--border)] last:border-0">
      <td className="p-3">
        <p className="font-medium text-[var(--text-primary)]">{source.label}</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{source.url}</p>
      </td>

      <td className="p-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--text-secondary)] whitespace-nowrap">Pages</label>
          <input
            type="number"
            min={1}
            max={50}
            value={pages}
            onChange={(e) => setPages(Math.max(1, Math.min(50, Number(e.target.value))))}
            className="w-16 px-2 py-1 text-xs rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </td>

      <td className="p-3 text-right">
        <div className="inline-flex items-center gap-2">
          <StatusDot status={status} />
          <ActionButton
            onClick={() => run(() => scrapeSource(source.key, pages))}
            status={status}
            icon={Play}
            label="Scrape now"
          />
        </div>
      </td>
    </tr>
  );
}

function SourcesTable() {
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-card)]">
        <p className="font-semibold text-[var(--text-primary)]">Sources</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Scrape a single source on demand.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
              <th className="text-left p-3 font-medium text-[var(--text-secondary)]">Source</th>
              <th className="text-left p-3 font-medium text-[var(--text-secondary)]">Pages</th>
              <th className="text-right p-3 font-medium text-[var(--text-secondary)]">Action</th>
            </tr>
          </thead>
          <tbody>
            {SOURCES.map((s) => (
              <SourceRow key={s.key} source={s} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab root ─────────────────────────────────────────────────────────────────

export function AdminSourcesTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Sources & Scraper</h2>
      <SchedulerCard />
      <PipelineControls />
      <SourcesTable />
    </div>
  );
}

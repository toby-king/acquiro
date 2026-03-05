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
    'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
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

// ─── Scheduler card helpers ───────────────────────────────────────────────────

function tzOffsetMs(tz: string, date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value ?? '0');
  let h = get('hour'); if (h === 24) h = 0;
  const local = Date.UTC(get('year'), get('month') - 1, get('day'), h, get('minute'), get('second'));
  return date.getTime() - local;
}

function computeNextRun(cron: string, tz: string): Date | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const minute = parseInt(parts[0], 10);
  const hour = parseInt(parts[1], 10);
  if (isNaN(minute) || isNaN(hour)) return null;

  const now = new Date();
  for (let d = 0; d <= 1; d++) {
    const localDate = new Date(now.getTime() + d * 86_400_000)
      .toLocaleDateString('en-CA', { timeZone: tz });
    const [y, m, day] = localDate.split('-').map(Number);
    const naive = new Date(Date.UTC(y, m - 1, day, hour, minute, 0));
    const result = new Date(naive.getTime() + tzOffsetMs(tz, naive));
    if (result > now) return result;
  }
  return null;
}

function fmtRelative(date: Date, now: Date): string {
  const mins = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtAbsolute(date: Date): string {
  return date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

function fmtNextLabel(date: Date, now: Date): string {
  const diffH = (date.getTime() - now.getTime()) / 3_600_000;
  const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (diffH < 24) return timeStr;
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + timeStr;
}

function fmtCountdown(date: Date, now: Date): string {
  const ms = date.getTime() - now.getTime();
  if (ms <= 0) return 'Due now';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
}

// ─── Stat cell ────────────────────────────────────────────────────────────────

function StatCell({
  label, value, sub, valueClass, loading,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
  loading?: boolean;
}) {
  const isEmpty = value === '—';
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">{label}</p>
      {loading ? (
        <div className="h-6 w-20 rounded bg-[var(--bg-secondary)] animate-pulse" />
      ) : (
        <>
          <p className={`text-xl font-semibold tabular-nums ${
            isEmpty ? 'text-[var(--text-tertiary)]' : (valueClass ?? 'text-[var(--text-primary)]')
          }`}>
            {value}
          </p>
          {sub && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{sub}</p>}
        </>
      )}
    </div>
  );
}

// ─── Scheduler card ───────────────────────────────────────────────────────────

function SchedulerCard() {
  const [info, setInfo]             = useState<SchedulerStatus | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toggling, setToggling]     = useState(false);
  const [now, setNow]               = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    try {
      setFetchError(null);
      setInfo(await getSchedulerStatus());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : String(err));
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
      // keep previous state
    } finally {
      setToggling(false);
    }
  };

  const nextRun   = info ? computeNextRun(info.cronExpression, info.timezone) : null;
  const loading   = !info && !fetchError;
  const enabled   = info?.schedulerEnabled ?? false;

  // Derived stat values
  const lastRunValue = info?.lastRun ? fmtRelative(new Date(info.lastRun), now) : '—';
  const lastRunSub   = info?.lastRun ? fmtAbsolute(new Date(info.lastRun)) : undefined;
  const nextRunValue = nextRun ? fmtNextLabel(nextRun, now) : '—';
  const nextRunSub   = nextRun && enabled
    ? fmtCountdown(nextRun, now)
    : (info && !enabled ? 'Scheduler off' : undefined);
  const addedValue    = info?.lastRunAdded    != null ? `+${info.lastRunAdded.toLocaleString()}`    : '—';
  const archivedValue = info?.lastRunArchived != null ? info.lastRunArchived.toLocaleString() : '—';

  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between gap-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3 min-w-0">
          {/* Animated status dot */}
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            {enabled && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${enabled ? 'bg-accent' : 'bg-[var(--border)]'}`} />
          </span>

          <div className="min-w-0">
            <p className="font-semibold text-[var(--text-primary)]">Daily Pipeline</p>
            {fetchError ? (
              <p className="text-xs text-red-400 mt-0.5" title={fetchError}>
                Could not reach scraper — {fetchError}
              </p>
            ) : loading ? (
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5 flex items-center gap-1.5">
                <Loader2 size={10} className="animate-spin" /> Fetching…
              </p>
            ) : (
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5 font-mono">
                {info!.cronExpression} · {info!.timezone}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {info && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              enabled
                ? 'bg-accent/10 text-accent'
                : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'
            }`}>
              {enabled ? 'Enabled' : 'Disabled'}
            </span>
          )}
          <Toggle
            enabled={enabled}
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[var(--border)]">
        <StatCell
          label="Last run"
          value={lastRunValue}
          sub={lastRunSub}
          loading={loading}
        />
        <StatCell
          label="Next run"
          value={nextRunValue}
          sub={nextRunSub}
          valueClass={enabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}
          loading={loading}
        />
        <StatCell
          label="Added last run"
          value={addedValue}
          valueClass="text-accent"
          loading={loading}
        />
        <StatCell
          label="Archived last run"
          value={archivedValue}
          loading={loading}
        />
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

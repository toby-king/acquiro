import { useEffect, useState } from 'react';
import { getAdminStats, getMrr } from '../../services/adminService';
import { Loader2 } from 'lucide-react';

export function AdminUsersTab() {
  const [stats, setStats] = useState<{ total_users: number; active_subscribers: number; churned_users: number } | null>(null);
  const [mrr, setMrr] = useState<{ mrr_cents: number; currency: string } | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [mrrError, setMrrError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMrr, setLoadingMrr] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingStats(true);
    setStatsError(null);
    getAdminStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((e) => {
        if (!cancelled) setStatsError(e instanceof Error ? e.message : 'Failed to load stats');
      })
      .finally(() => {
        if (!cancelled) setLoadingStats(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingMrr(true);
    setMrrError(null);
    getMrr()
      .then((data) => {
        if (!cancelled) setMrr(data);
      })
      .catch((e) => {
        if (!cancelled) setMrrError(e instanceof Error ? e.message : 'Failed to load MRR');
      })
      .finally(() => {
        if (!cancelled) setLoadingMrr(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const formatCurrency = (cents: number, currency: string) => {
    const symbol = currency === 'gbp' ? '£' : currency === 'usd' ? '$' : currency.toUpperCase() + ' ';
    return `${symbol}${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">User & subscription stats</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats ? (
          <div className="col-span-full sm:col-span-2 lg:col-span-3 flex items-center gap-2 text-[var(--text-secondary)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading user stats…
          </div>
        ) : statsError ? (
          <div className="col-span-full rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
            {statsError}
          </div>
        ) : stats ? (
          <>
            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
              <p className="text-[var(--text-secondary)] text-sm">Total users</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats.total_users.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
              <p className="text-[var(--text-secondary)] text-sm">Active subscribers</p>
              <p className="text-2xl font-bold text-accent mt-1">{stats.active_subscribers.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
              <p className="text-[var(--text-secondary)] text-sm">Churned users</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats.churned_users.toLocaleString()}</p>
            </div>
          </>
        ) : null}

        {loadingMrr ? (
          <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4 flex items-center gap-2 text-[var(--text-secondary)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading MRR…
          </div>
        ) : mrrError ? (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
            {mrrError}
          </div>
        ) : mrr ? (
          <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
            <p className="text-[var(--text-secondary)] text-sm">Current MRR</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {formatCurrency(mrr.mrr_cents, mrr.currency)}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

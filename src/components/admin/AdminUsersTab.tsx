import { useEffect, useState } from 'react';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { getAdminStats, getMrr, getRevenue, type AdminStatsResponse, type RevenueResponse } from '../../services/adminService';
import { chartDefaultOptions, chartDoughnutLegend, CHART_COLOR_PRIMARY } from './chartConfig';
import { Loader2 } from 'lucide-react';

function ChartCard({
  title,
  loading,
  empty,
  children,
}: {
  title: string;
  loading: boolean;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4 h-72 flex flex-col">
      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">{title}</h3>
      <div className="flex-1 min-h-0">
        {loading && (
          <div className="h-full flex items-center justify-center text-[var(--text-tertiary)]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
        {!loading && empty && (
          <div className="h-full flex items-center justify-center text-[var(--text-tertiary)] text-sm">No data yet</div>
        )}
        {!loading && !empty && children}
      </div>
    </div>
  );
}

export function AdminUsersTab() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [mrr, setMrr] = useState<{ mrr_cents: number; currency: string } | null>(null);
  const [revenue, setRevenue] = useState<RevenueResponse | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [mrrError, setMrrError] = useState<string | null>(null);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMrr, setLoadingMrr] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(true);

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

  useEffect(() => {
    let cancelled = false;
    setLoadingRevenue(true);
    setRevenueError(null);
    getRevenue()
      .then((data) => {
        if (!cancelled) setRevenue(data);
      })
      .catch((e) => {
        if (!cancelled) setRevenueError(e instanceof Error ? e.message : 'Failed to load revenue');
      })
      .finally(() => {
        if (!cancelled) setLoadingRevenue(false);
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

      {/* Charts: 2-col doughnut + line, full-width bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Subscriber Breakdown"
          loading={loadingStats}
          empty={!stats || (stats.active_subscribers === 0 && stats.churned_users === 0)}
        >
          {stats && (stats.active_subscribers > 0 || stats.churned_users > 0) && (
            <div className="h-full min-h-[200px]">
              <Doughnut
                data={{
                  labels: ['Active', 'Churned'],
                  datasets: [
                    {
                      data: [stats.active_subscribers, stats.churned_users],
                      backgroundColor: [CHART_COLOR_PRIMARY, 'rgba(163, 163, 163, 0.5)'],
                      borderColor: ['transparent', 'transparent'],
                    },
                  ],
                }}
                options={{
                  ...chartDefaultOptions,
                  plugins: {
                    ...chartDefaultOptions.plugins,
                    ...chartDoughnutLegend,
                    tooltip: { ...chartDefaultOptions.plugins?.tooltip },
                  },
                }}
              />
            </div>
          )}
        </ChartCard>
        <ChartCard
          title="Subscriber Growth"
          loading={loadingStats}
          empty={!stats?.signups_over_time?.length}
        >
          {stats?.signups_over_time?.length ? (
            <div className="h-full min-h-[200px]">
              <Line
                data={{
                  labels: stats.signups_over_time.map((d) => d.date),
                  datasets: [
                    {
                      label: 'New signups',
                      data: stats.signups_over_time.map((d) => d.count),
                      borderColor: CHART_COLOR_PRIMARY,
                      backgroundColor: CHART_COLOR_PRIMARY + '20',
                      fill: true,
                      tension: 0.3,
                    },
                  ],
                }}
                options={chartDefaultOptions}
              />
            </div>
          ) : null}
        </ChartCard>
      </div>
      <ChartCard
        title="Monthly Revenue"
        loading={loadingRevenue}
        empty={!revenue?.monthly_revenue?.length || revenue.monthly_revenue.every((m) => m.revenue === 0)}
      >
        {revenue?.monthly_revenue?.length ? (
          <div className="h-full min-h-[200px]">
            <Bar
              data={{
                labels: revenue.monthly_revenue.map((m) => m.month),
                datasets: [
                  {
                    label: 'Revenue (£)',
                    data: revenue.monthly_revenue.map((m) => m.revenue / 100),
                    backgroundColor: CHART_COLOR_PRIMARY,
                  },
                ],
              }}
              options={{
                ...chartDefaultOptions,
                scales: {
                  ...chartDefaultOptions.scales,
                  y: {
                    ...chartDefaultOptions.scales?.y,
                    ticks: { ...chartDefaultOptions.scales?.y?.ticks, callback: (v) => '£' + (v as number) },
                  },
                },
              }}
            />
          </div>
        ) : null}
      </ChartCard>
      {revenueError && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">{revenueError}</div>
      )}
    </div>
  );
}

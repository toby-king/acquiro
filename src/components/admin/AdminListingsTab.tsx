import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  getAdminListings,
  getAdminStats,
  type AdminListing,
  type AdminListingsResponse,
} from '../../services/adminService';
import { chartDefaultOptions, CHART_COLOR_PRIMARY, CHART_COLORS } from './chartConfig';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const PAGE_SIZE = 10;

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

export function AdminListingsTab() {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminListingsResponse | null>(null);
  const [listingStats, setListingStats] = useState<{ listings_by_source?: { source: string; count: number }[]; listings_over_time?: { date: string; by_source: Record<string, number> }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingChartStats, setLoadingChartStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAdminListings({
      search: search || undefined,
      source: sourceFilter || undefined,
      page,
      page_size: PAGE_SIZE,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load listings');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, sourceFilter, page]);

  useEffect(() => {
    let cancelled = false;
    setLoadingChartStats(true);
    getAdminStats()
      .then((s) => {
        if (!cancelled) setListingStats({ listings_by_source: s.listings_by_source, listings_over_time: s.listings_over_time });
      })
      .catch(() => {
        if (!cancelled) setListingStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingChartStats(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = data ? Math.max(1, Math.ceil(data.total_count / PAGE_SIZE)) : 1;

  const bySource = listingStats?.listings_by_source?.slice().sort((a, b) => b.count - a.count) ?? [];
  const overTime = listingStats?.listings_over_time ?? [];
  const sourceNames = overTime.length
    ? Array.from(
        new Set(overTime.flatMap((d) => Object.keys(d.by_source ?? {})))
      ).sort()
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Listings</h2>

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
            <p className="text-[var(--text-secondary)] text-sm">Total listings</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{data.total_count.toLocaleString()}</p>
          </div>
          {data.by_source?.map(({ source, count }) => (
            <div key={source} className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
              <p className="text-[var(--text-secondary)] text-sm truncate" title={source}>{source}</p>
              <p className="text-xl font-bold text-[var(--text-primary)] mt-1">{count.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Listings by Source"
          loading={loadingChartStats}
          empty={bySource.length === 0}
        >
          {bySource.length > 0 && (
            <div className="h-full min-h-[200px]">
              <Bar
                data={{
                  labels: bySource.map((s) => s.source),
                  datasets: [
                    {
                      label: 'Count',
                      data: bySource.map((s) => s.count),
                      backgroundColor: CHART_COLOR_PRIMARY,
                    },
                  ],
                }}
                options={{
                  ...chartDefaultOptions,
                  indexAxis: 'y',
                }}
              />
            </div>
          )}
        </ChartCard>
        <ChartCard
          title="New Listings Over Time"
          loading={loadingChartStats}
          empty={overTime.length === 0 || sourceNames.length === 0}
        >
          {overTime.length > 0 && sourceNames.length > 0 && (
            <div className="h-full min-h-[200px]">
              <Line
                data={{
                  labels: overTime.map((d) => d.date),
                  datasets: sourceNames.map((source, i) => ({
                    label: source,
                    data: overTime.map((d) => (d.by_source?.[source] ?? 0)),
                    borderColor: CHART_COLORS[i % CHART_COLORS.length],
                    backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + '20',
                    fill: false,
                    tension: 0.3,
                  })),
                }}
                options={chartDefaultOptions}
              />
            </div>
          )}
        </ChartCard>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="Search by title or location..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[200px] flex-1 max-w-md px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm"
        />
        <input
          type="text"
          placeholder="Filter by source"
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value);
            setPage(1);
          }}
          className="w-40 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--text-secondary)] py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading listings…
        </div>
      ) : data ? (
        <>
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <th className="text-left p-3 font-medium text-[var(--text-primary)]">Title</th>
                    <th className="text-left p-3 font-medium text-[var(--text-primary)]">Source</th>
                    <th className="text-left p-3 font-medium text-[var(--text-primary)]">Location</th>
                    <th className="text-left p-3 font-medium text-[var(--text-primary)]">Asking price</th>
                    <th className="text-left p-3 font-medium text-[var(--text-primary)]">Date added</th>
                    <th className="w-10 p-2" />
                  </tr>
                </thead>
                <tbody>
                  {data.listings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-[var(--text-secondary)]">
                        No listings found.
                      </td>
                    </tr>
                  ) : (
                    data.listings.map((row) => (
                      <ListingRow
                        key={row.id}
                        row={row}
                        expanded={expandedId === row.id}
                        onToggle={() => setExpandedId((id) => (id === row.id ? null : row.id))}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-50 hover:bg-[var(--bg-card)]"
              >
                Previous
              </button>
              <span className="text-[var(--text-secondary)] text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-50 hover:bg-[var(--bg-card)]"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function ListingRow({
  row,
  expanded,
  onToggle,
}: {
  row: AdminListing;
  expanded: boolean;
  onToggle: () => void;
}) {
  const price =
    row.asking_price != null
      ? typeof row.asking_price === 'number'
        ? `£${row.asking_price.toLocaleString()}`
        : String(row.asking_price)
      : '—';
  const date = row.date_added
    ? new Date(row.date_added).toLocaleDateString(undefined, { dateStyle: 'short' })
    : '—';

  return (
    <>
      <tr
        className="border-b border-[var(--border)] hover:bg-[var(--bg-card)]/50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="p-3 text-[var(--text-primary)] max-w-[200px] truncate" title={row.title}>
          {row.title}
        </td>
        <td className="p-3 text-[var(--text-secondary)]">{row.source}</td>
        <td className="p-3 text-[var(--text-secondary)] max-w-[150px] truncate" title={row.location ?? ''}>
          {row.location ?? '—'}
        </td>
        <td className="p-3 text-[var(--text-primary)]">{price}</td>
        <td className="p-3 text-[var(--text-secondary)]">{date}</td>
        <td className="p-2">{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</td>
      </tr>
      {expanded && (
        <tr className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
          <td colSpan={6} className="p-4">
            <pre className="text-xs text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(row, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

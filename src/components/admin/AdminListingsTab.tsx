import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  getAdminListings,
  type AdminListing,
  type AdminListingsResponse,
} from '../../services/adminService';
import { chartDefaultOptions, CHART_COLOR_PRIMARY, CHART_COLORS } from './chartConfig';
import { Loader2, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import type { AdminSortKey, AdminSortDir } from '../../services/adminService';

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
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<AdminSortKey>('date_added');
  const [sortDir, setSortDir] = useState<AdminSortDir>('desc');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProgress(null);
    getAdminListings({
      search: search || undefined,
      source: sourceFilter || undefined,
      page,
      page_size: PAGE_SIZE,
      sort_by: sortBy,
      sort_dir: sortDir,
      onProgress: (loaded, total) => {
        if (!cancelled) setProgress({ loaded, total });
      },
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load listings');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setProgress(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [search, sourceFilter, page, sortBy, sortDir]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total_count / PAGE_SIZE)) : 1;

  function handleSort(col: AdminSortKey) {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
    setPage(1);
  }

  const bySource = data?.by_source?.slice().sort((a, b) => b.count - a.count) ?? [];
  const overTime = data?.listings_over_time ?? [];
  const sourceNames = overTime.length
    ? Array.from(
        new Set(overTime.flatMap((d) => Object.keys(d.by_source ?? {})))
      ).sort()
    : [];

  // Show full-page loading UI on first load (no data yet)
  if (loading && !data) {
    const pct = progress ? Math.min(100, Math.round((progress.loaded / progress.total) * 100)) : 0;
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 w-full">
        <p className="text-sm text-[var(--text-secondary)]">
          {progress
            ? `Loading ${progress.loaded.toLocaleString()} / ${progress.total.toLocaleString()} listings…`
            : 'Loading listings…'}
        </p>
        <div className="w-full h-2 rounded-full bg-[var(--bg-card)] overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: progress ? `${pct}%` : '5%' }}
          />
        </div>
        {progress && (
          <p className="text-xs text-[var(--text-tertiary)]">{pct}%</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Listings</h2>

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total listings', value: data.total_count.toLocaleString() },
            { label: 'Added today', value: data.added_today.toLocaleString() },
            { label: 'Added this week', value: data.added_this_week.toLocaleString() },
            {
              label: 'Avg. asking price',
              value: data.avg_asking_price != null ? `£${data.avg_asking_price.toLocaleString()}` : '—',
            },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4">
              <p className="text-[var(--text-secondary)] text-sm">{label}</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Listings by Source" loading={false} empty={bySource.length === 0}>
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
                options={{ ...chartDefaultOptions, indexAxis: 'y' }}
              />
            </div>
          )}
        </ChartCard>
        <ChartCard title="New Listings per Day" loading={false} empty={overTime.length === 0 || sourceNames.length === 0}>
          {overTime.length > 0 && sourceNames.length > 0 && (
            <div className="h-full min-h-[200px]">
              <Line
                data={{
                  labels: overTime.map((d) => d.date),
                  datasets: sourceNames.map((source, i) => ({
                    label: source,
                    data: overTime.map((d) => d.by_source?.[source] ?? 0),
                    borderColor: CHART_COLORS[i % CHART_COLORS.length],
                    backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + '20',
                    fill: false,
                    tension: 0.3,
                    pointRadius: 2,
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
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="min-w-[200px] flex-1 max-w-md px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm"
        />
        <input
          type="text"
          placeholder="Filter by source"
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
          className="w-40 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] text-sm"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">{error}</div>
      )}

      {data && (
        <>
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    {(
                      [
                        { label: 'Title', col: 'title' },
                        { label: 'Source', col: 'source' },
                        { label: 'Location', col: 'location' },
                        { label: 'Asking price', col: 'asking_price' },
                        { label: 'Date added', col: 'date_added' },
                      ] as { label: string; col: AdminSortKey }[]
                    ).map(({ label, col }) => (
                      <th
                        key={col}
                        className="text-left p-3 font-medium text-[var(--text-primary)] cursor-pointer select-none hover:text-accent"
                        onClick={() => handleSort(col)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {label}
                          {sortBy === col
                            ? sortDir === 'asc'
                              ? <ChevronUp size={14} />
                              : <ChevronDown size={14} />
                            : <ChevronsUpDown size={14} className="opacity-30" />}
                        </span>
                      </th>
                    ))}
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
                className="px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-50 hover:bg-[var(--bg-card)]"
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
                className="px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-50 hover:bg-[var(--bg-card)]"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function fmt(val: unknown): string {
  if (val == null || val === '') return '—';
  if (typeof val === 'number') return val.toLocaleString();
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'string') {
    const d = new Date(val);
    if (/^\d{4}-\d{2}-\d{2}T/.test(val) && !isNaN(d.getTime()))
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: '2-digit' });
    return val;
  }
  return String(val);
}

const KNOWN_FIELDS = new Set([
  'id', 'title', 'source', 'location', 'asking_price', 'date_added',
  '_id', 'business_name_text', 'listing_id_text', 'location_text',
  'asking_price_number', 'Created Date', 'Modified Date',
]);

function ListingDetail({ row }: { row: AdminListing }) {
  const url = row['url_text'] as string | undefined;
  const description = row['description_text'] as string | undefined;
  const sector = row['sector_text'] as string | undefined;
  const tenure = row['tenure_text'] as string | undefined;
  const turnover = row['turnover_text'] ?? (row['turnover_number'] != null ? `£${Number(row['turnover_number']).toLocaleString()}` : undefined);
  const ebitda = row['ebitda_text'] ?? (row['ebitda_number'] != null ? `£${Number(row['ebitda_number']).toLocaleString()}` : undefined);
  const netProfit = row['net_profit_text'] ?? (row['net_profit_number'] != null ? `£${Number(row['net_profit_number']).toLocaleString()}` : undefined);
  const rent = row['rent_text'] ?? (row['rent_number'] != null ? `£${Number(row['rent_number']).toLocaleString()}` : undefined);

  const highlights: { label: string; value: unknown }[] = [
    { label: 'Listing ID', value: row['listing_id_text'] },
    { label: 'Source', value: row.source },
    { label: 'Location', value: row.location },
    { label: 'Sector', value: sector },
    { label: 'Tenure', value: tenure },
    { label: 'Asking price', value: row.asking_price != null ? `£${Number(row.asking_price).toLocaleString()}` : null },
    { label: 'Turnover', value: turnover },
    { label: 'EBITDA', value: ebitda },
    { label: 'Net profit', value: netProfit },
    { label: 'Rent', value: rent },
    { label: 'Date added', value: row.date_added },
  ];

  const knownValueKeys = new Set([
    ...Array.from(KNOWN_FIELDS),
    'url_text', 'description_text', 'sector_text', 'tenure_text',
    'turnover_text', 'turnover_number', 'ebitda_text', 'ebitda_number',
    'net_profit_text', 'net_profit_number', 'rent_text', 'rent_number',
  ]);
  const extra = Object.entries(row).filter(
    ([k, v]) => !knownValueKeys.has(k) && v != null && v !== '' && !Array.isArray(v)
  );

  return (
    <div className="space-y-4 text-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <p className="font-semibold text-[var(--text-primary)] text-base">{row.title || '—'}</p>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs text-accent underline hover:opacity-80"
            onClick={(e) => e.stopPropagation()}
          >
            View source ↗
          </a>
        )}
      </div>

      {/* Key fields grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
        {highlights.map(({ label, value }) => (
          <div key={label}>
            <p className="text-[var(--text-tertiary)] text-xs uppercase tracking-wide">{label}</p>
            <p className="text-[var(--text-primary)] mt-0.5">{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      {description && (
        <div>
          <p className="text-[var(--text-tertiary)] text-xs uppercase tracking-wide mb-1">Description</p>
          <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{description}</p>
        </div>
      )}

      {/* Remaining fields */}
      {extra.length > 0 && (
        <div>
          <p className="text-[var(--text-tertiary)] text-xs uppercase tracking-wide mb-2">Additional fields</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
            {extra.map(([k, v]) => (
              <div key={k}>
                <p className="text-[var(--text-tertiary)] text-xs">{k}</p>
                <p className="text-[var(--text-secondary)] text-xs mt-0.5 break-all">{fmt(v)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
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
    ? new Date(row.date_added).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: '2-digit' })
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
            <ListingDetail row={row} />
          </td>
        </tr>
      )}
    </>
  );
}

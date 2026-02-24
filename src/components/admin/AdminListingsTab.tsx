import { useEffect, useState } from 'react';
import {
  getAdminListings,
  type AdminListing,
  type AdminListingsResponse,
} from '../../services/adminService';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const PAGE_SIZE = 10;

export function AdminListingsTab() {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminListingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
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

  const totalPages = data ? Math.max(1, Math.ceil(data.total_count / PAGE_SIZE)) : 1;

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

import { useEffect, useState, useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  getConversations,
  getConversation,
  type ConversationSummary,
  type ConversationDetails,
} from '../../services/adminService';
import { chartDefaultOptions, CHART_COLOR_PRIMARY } from './chartConfig';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const PAGE_SIZE = 20;

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

export function AdminAgentActivityTab() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetails | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getConversations({ page_size: PAGE_SIZE })
      .then((res) => {
        if (!cancelled) {
          setConversations(res.conversations);
          setNextCursor(res.next_cursor);
          setHasMore(res.has_more ?? false);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load conversations');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!expandedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    getConversation(expandedId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expandedId]);

  const loadMore = () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    getConversations({ page_size: PAGE_SIZE, cursor: nextCursor })
      .then((res) => {
        setConversations((prev) => [...prev, ...res.conversations]);
        setNextCursor(res.next_cursor);
        setHasMore(res.has_more ?? false);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load more'))
      .finally(() => setLoading(false));
  };

  const last30Days = useMemo(() => {
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, []);

  const { callsPerDay, avgDurationPerDay } = useMemo(() => {
    const countByDay: Record<string, number> = {};
    const durationSumByDay: Record<string, number> = {};
    const durationCountByDay: Record<string, number> = {};
    last30Days.forEach((d) => {
      countByDay[d] = 0;
      durationSumByDay[d] = 0;
      durationCountByDay[d] = 0;
    });
    conversations.forEach((c) => {
      if (c.start_time_unix_secs) {
        const date = new Date(c.start_time_unix_secs * 1000).toISOString().slice(0, 10);
        if (date in countByDay) {
          countByDay[date]++;
          if (c.call_duration_secs != null) {
            durationSumByDay[date] += c.call_duration_secs;
            durationCountByDay[date]++;
          }
        }
      }
    });
    const avgDurationPerDay = last30Days.map((d) =>
      durationCountByDay[d] > 0 ? durationSumByDay[d] / durationCountByDay[d] / 60 : 0
    );
    return {
      callsPerDay: last30Days.map((d) => countByDay[d]),
      avgDurationPerDay,
    };
  }, [conversations, last30Days]);

  const chartLabels = last30Days.map((d) => {
    const [, m, day] = d.split('-');
    return `${day}/${m}`;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent calls</h2>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && conversations.length === 0 ? (
        <div className="flex items-center gap-2 text-[var(--text-secondary)] py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading conversations…
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-8 text-center text-[var(--text-secondary)]">
          No conversations yet. Connect ElevenLabs API and ensure ELEVENLABS_API_KEY is set on the backend.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="Calls Per Day"
              loading={loading && conversations.length === 0}
              empty={conversations.length === 0}
            >
              <div className="h-full min-h-[200px]">
                <Bar
                  data={{
                    labels: chartLabels,
                    datasets: [
                      {
                        label: 'Calls',
                        data: callsPerDay,
                        backgroundColor: CHART_COLOR_PRIMARY,
                      },
                    ],
                  }}
                  options={chartDefaultOptions}
                />
              </div>
            </ChartCard>
            <ChartCard
              title="Average Call Duration (min)"
              loading={loading && conversations.length === 0}
              empty={conversations.length === 0}
            >
              <div className="h-full min-h-[200px]">
                <Line
                  data={{
                    labels: chartLabels,
                    datasets: [
                      {
                        label: 'Avg duration (min)',
                        data: avgDurationPerDay,
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
            </ChartCard>
          </div>

          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <th className="text-left p-3 font-medium text-[var(--text-primary)]">Time</th>
                    <th className="text-left p-3 font-medium text-[var(--text-primary)]">Duration</th>
                    <th className="text-left p-3 font-medium text-[var(--text-primary)]">Messages</th>
                    <th className="text-left p-3 font-medium text-[var(--text-primary)]">Status</th>
                    <th className="w-10 p-2" />
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((c) => (
                    <ConversationRow
                      key={c.conversation_id}
                      row={c}
                      expanded={expandedId === c.conversation_id}
                      detail={expandedId === c.conversation_id ? detail : null}
                      loadingDetail={expandedId === c.conversation_id && loadingDetail}
                      onToggle={() =>
                        setExpandedId((id) => (id === c.conversation_id ? null : c.conversation_id))
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-card)] disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function ConversationRow({
  row,
  expanded,
  detail,
  loadingDetail,
  onToggle,
}: {
  row: ConversationSummary;
  expanded: boolean;
  detail: ConversationDetails | null;
  loadingDetail: boolean;
  onToggle: () => void;
}) {
  const time = row.start_time_unix_secs
    ? new Date(row.start_time_unix_secs * 1000).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '—';
  const duration =
    row.call_duration_secs != null
      ? `${Math.floor(row.call_duration_secs / 60)}m ${row.call_duration_secs % 60}s`
      : '—';

  return (
    <>
      <tr
        className="border-b border-[var(--border)] hover:bg-[var(--bg-card)]/50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="p-3 text-[var(--text-primary)]">{time}</td>
        <td className="p-3 text-[var(--text-secondary)]">{duration}</td>
        <td className="p-3 text-[var(--text-secondary)]">{row.message_count ?? '—'}</td>
        <td className="p-3 text-[var(--text-secondary)]">{row.status ?? '—'}</td>
        <td className="p-2">{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</td>
      </tr>
      {expanded && (
        <tr className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
          <td colSpan={5} className="p-4">
            {loadingDetail ? (
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading transcript…
              </div>
            ) : detail ? (
              <div className="space-y-2 text-sm">
                {detail.transcript_summary != null && detail.transcript_summary !== '' && (
                  <p className="text-[var(--text-primary)]"><strong>Summary:</strong> {String(detail.transcript_summary)}</p>
                )}
                {detail.transcript && Array.isArray(detail.transcript) && detail.transcript.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-[var(--text-secondary)] font-medium mb-1">Transcript</p>
                    <div className="rounded bg-[var(--bg-primary)] p-3 max-h-60 overflow-y-auto space-y-1">
                      {detail.transcript.map((entry: { role?: string; message?: string }, i: number) => (
                        <p key={i} className="text-[var(--text-primary)]">
                          <span className="text-accent font-medium">{String(entry.role ?? '?')}:</span> {String(entry.message ?? '')}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <pre className="text-xs text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(detail, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-[var(--text-secondary)]">No details available.</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

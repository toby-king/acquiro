const SCRAPER_BASE = import.meta.env.VITE_SCRAPER_URL as string;
const ADMIN_KEY = import.meta.env.VITE_SCRAPER_ADMIN_KEY as string;

export type SourceKey = 'rightbiz' | 'cogogo' | 'daltons' | 'businessesforsale';

export interface SchedulerStatus {
  schedulerEnabled: boolean;
  cronExpression: string;
  timezone: string;
  /** ISO string of when the pipeline last completed — not yet returned by server */
  lastRun?: string | null;
  /** Total listings added in the last pipeline run — not yet returned by server */
  lastRunAdded?: number | null;
  /** Total listings archived in the last pipeline run — not yet returned by server */
  lastRunArchived?: number | null;
  /** Total matches generated across all users in the last pipeline run */
  lastRunMatches?: number | null;
}

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ADMIN_KEY}`,
  };
}

export async function getSchedulerStatus(): Promise<SchedulerStatus> {
  const res = await fetch(`${SCRAPER_BASE}/admin/status`, {
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
  return res.json();
}

export async function setSchedulerEnabled(enabled: boolean): Promise<void> {
  const path = enabled ? '/admin/scheduler/enable' : '/admin/scheduler/disable';
  const res = await fetch(`${SCRAPER_BASE}${path}`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`Scheduler toggle failed: ${res.status}`);
}

export async function runPipeline(): Promise<void> {
  const res = await fetch(`${SCRAPER_BASE}/admin/run-pipeline`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`Run pipeline failed: ${res.status}`);
}

export async function runScrape(): Promise<void> {
  const res = await fetch(`${SCRAPER_BASE}/admin/run-scrape`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`Run scrape failed: ${res.status}`);
}

export async function runMatches(): Promise<void> {
  const res = await fetch(`${SCRAPER_BASE}/admin/run-matches`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`Run matches failed: ${res.status}`);
}

export async function scrapeSource(source: SourceKey, pages: number = 5): Promise<void> {
  const res = await fetch(`${SCRAPER_BASE}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sources: source, pages }),
  });
  if (!res.ok) throw new Error(`Scrape failed: ${res.status}`);
}

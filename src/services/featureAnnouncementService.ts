const API_URL = import.meta.env.VITE_SCRAPER_URL as string;
const ADMIN_KEY = import.meta.env.VITE_SCRAPER_ADMIN_KEY as string;

export interface FeatureAnnouncement {
  id: string;
  name: string;
  headline: string;
  cta: string;
  active: boolean;
  max_impressions: number;
  completion_field: string;
  created_at: string;
}

export interface FeatureImpressionStats {
  totalImpressions: number;
  uniqueUsers: number;
}

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ADMIN_KEY}`,
  };
}

export async function getFeatureAnnouncements(): Promise<FeatureAnnouncement[]> {
  const res = await fetch(`${API_URL}/admin/feature-announcements`, { headers: headers() });
  if (!res.ok) throw new Error(`Failed to fetch feature announcements: ${res.status}`);
  const json = await res.json();
  return json.announcements ?? [];
}

export async function createFeatureAnnouncement(data: {
  name: string;
  headline: string;
  cta?: string;
  active?: boolean;
  max_impressions?: number;
  completion_field?: string;
}): Promise<string> {
  const res = await fetch(`${API_URL}/admin/feature-announcements`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create feature announcement: ${res.status}`);
  const json = await res.json();
  return json.id;
}

export async function updateFeatureAnnouncement(id: string, data: Partial<FeatureAnnouncement>): Promise<void> {
  const res = await fetch(`${API_URL}/admin/feature-announcements/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update feature announcement: ${res.status}`);
}

export async function getFeatureImpressionStats(id: string): Promise<FeatureImpressionStats> {
  const res = await fetch(`${API_URL}/admin/feature-announcements/${id}/stats`, { headers: headers() });
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return res.json();
}

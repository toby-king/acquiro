const SCRAPER_BASE = import.meta.env.VITE_SCRAPER_URL as string;

const PRODUCTION_BACKEND = 'https://acquiro-backend.vercel.app';
function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') return PRODUCTION_BACKEND;
  }
  return (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '') || (import.meta.env.PROD ? PRODUCTION_BACKEND : 'http://localhost:3001');
}
const BACKEND_URL = getBackendUrl();

export interface UserNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  status: 'unread' | 'actioned';
  langcliffe_outreach: string;
  created_at: string;
  nda_file_url?: string;
}

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
  const res = await fetch(`${BACKEND_URL}/api/bubble/notifications/${userId}`);
  if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`);
  const json = await res.json();
  return json.response?.results ?? [];
}

export async function markNotificationActioned(notificationId: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/bubble/notifications/${notificationId}/action`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to mark notification actioned: ${res.status}`);
}

export async function getNdaFileUrl(outreachId: string): Promise<string | null> {
  const res = await fetch(`${BACKEND_URL}/api/bubble/notifications/nda/${outreachId}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.nda_file_url ?? null;
}

export async function uploadSignedNDA(outreachId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${SCRAPER_BASE}/user/outreach/${outreachId}/signed-nda`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Failed to upload signed NDA: ${res.status}`);
}

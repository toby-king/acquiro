const BUBBLE_DATA_BASE = (import.meta.env.VITE_BUBBLE_API_BASE_URL as string)
  ?.replace(/\/wf(\/.*)?$/, '/obj') ?? '';
const API_TOKEN = import.meta.env.VITE_BUBBLE_API_TOKEN as string;
const SCRAPER_BASE = import.meta.env.VITE_SCRAPER_URL as string;

export interface UserNotification {
  _id: string;
  type_text: string;
  title_text: string;
  body_text: string;
  status_text: 'unread' | 'actioned';
  outreach_langcliffeoutreach: string;
  'Created Date': string;
  // Populated from the linked outreach record:
  nda_file_url?: string;
}

export async function getUserNotifications(userId: string): Promise<UserNotification[]> {
  const constraints = JSON.stringify([
    { key: 'user_user',   constraint_type: 'equals', value: userId },
    { key: 'status_text', constraint_type: 'equals', value: 'unread' },
  ]);
  const url = `${BUBBLE_DATA_BASE}/UserNotification?constraints=${encodeURIComponent(constraints)}&sort_field=Created Date&descending=true`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`);
  const json = await res.json();
  return json.response?.results ?? [];
}

export async function markNotificationActioned(notificationId: string): Promise<void> {
  const res = await fetch(`${BUBBLE_DATA_BASE}/UserNotification/${notificationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify({ status_text: 'actioned' }),
  });
  if (!res.ok) throw new Error(`Failed to mark notification actioned: ${res.status}`);
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

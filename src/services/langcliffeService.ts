const SCRAPER_BASE = import.meta.env.VITE_SCRAPER_URL as string;
const ADMIN_KEY = import.meta.env.VITE_SCRAPER_ADMIN_KEY as string;

export interface OutreachDraft {
  _id: string;
  listing_id_text: string;
  business_name_text: string;
  langcliffe_contact_text: string;
  user_user: string;
  draft_body_text: string;
  status_text: 'pending' | 'sent' | 'rejected';
  'Created Date': string;
}

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ADMIN_KEY}`,
  };
}

export async function getLangcliffeQueue(): Promise<OutreachDraft[]> {
  const res = await fetch(`${SCRAPER_BASE}/admin/langcliffe-queue`, {
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`Queue fetch failed: ${res.status}`);
  const json = await res.json();
  return json.queue ?? [];
}

export async function approveOutreach(id: string): Promise<void> {
  const res = await fetch(`${SCRAPER_BASE}/admin/langcliffe-queue/${id}/approve`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`Approve failed: ${res.status}`);
}

export async function rejectOutreach(id: string, feedback?: string): Promise<string> {
  const res = await fetch(`${SCRAPER_BASE}/admin/langcliffe-queue/${id}/reject`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ feedback }),
  });
  if (!res.ok) throw new Error(`Reject failed: ${res.status}`);
  const json = await res.json();
  return json.draft ?? '';
}

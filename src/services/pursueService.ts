const API_URL = import.meta.env.VITE_SCRAPER_URL as string;
const ADMIN_KEY = import.meta.env.VITE_SCRAPER_ADMIN_KEY as string;

export interface PursueRequest {
  _id: string;
  business_name_text: string;
  status_text: 'pending' | 'contacted' | 'responded' | 'closed';
  admin_notes_text: string;
  listing_url_text: string;
  'Created Date': string;
  // Bubble returns linked fields as IDs
  user_user: string;
  business_custom_business: string;
}

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ADMIN_KEY}`,
  };
}

export async function getPursueRequests(): Promise<PursueRequest[]> {
  const res = await fetch(`${API_URL}/admin/pursue-requests`, { headers: headers() });
  if (!res.ok) throw new Error(`Failed to fetch pursue requests: ${res.status}`);
  const json = await res.json();
  return json.requests ?? [];
}

export async function markContacted(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/pursue-requests/${id}/contacted`, {
    method: 'POST', headers: headers(),
  });
  if (!res.ok) throw new Error(`Failed to mark contacted: ${res.status}`);
}

export async function markResponded(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/pursue-requests/${id}/responded`, {
    method: 'POST', headers: headers(),
  });
  if (!res.ok) throw new Error(`Failed to mark responded: ${res.status}`);
}

export async function markClosed(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/pursue-requests/${id}/closed`, {
    method: 'POST', headers: headers(),
  });
  if (!res.ok) throw new Error(`Failed to mark closed: ${res.status}`);
}

export async function updateNotes(id: string, notes: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/pursue-requests/${id}/notes`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) throw new Error(`Failed to update notes: ${res.status}`);
}

const API_URL = import.meta.env.VITE_SCRAPER_URL as string;
const ADMIN_KEY = import.meta.env.VITE_SCRAPER_ADMIN_KEY as string;

export interface PursueRequest {
  id: string;
  business_name: string;
  status: 'pending' | 'contacted' | 'responded' | 'closed';
  admin_notes: string;
  listing_url: string;
  created_at: string;
  user_id: string;
  business_id: string;
  // Enriched by backend
  user_name?: string | null;
  user_email?: string | null;
  business_description?: string | null;
  business_sector?: string | null;
  business_location?: string | null;
  business_asking_price?: number | null;
  business_turnover?: number | null;
  business_net_profit?: number | null;
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

const SCRAPER_BASE = import.meta.env.VITE_SCRAPER_URL as string;
const ADMIN_KEY = import.meta.env.VITE_SCRAPER_ADMIN_KEY as string;

export interface OutreachDraft {
  id: string;
  listing_id: string;
  business_name: string;
  langcliffe_contact: string;
  user_email?: string;
  user_id: string;
  draft_body: string;
  inbound_email?: string;
  reply_draft?: string;
  langcliffe_reply_body?: string;
  conversation_history?: string;
  nda_file?: string;
  signed_nda_file?: string;
  acknowledgment_draft?: string;
  nda_return_draft?: string;
  status: 'pending' | 'sent' | 'rejected' | 'pending_reply' | 'nda_received' | 'nda_acknowledged' | 'nda_signed' | 'nda_returned' | 'misc';
  created_at: string;
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

export async function deleteOutreach(id: string): Promise<void> {
  const res = await fetch(`${SCRAPER_BASE}/admin/langcliffe-queue/${id}/delete`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}

export async function approveReply(id: string): Promise<void> {
  const res = await fetch(`${SCRAPER_BASE}/admin/langcliffe-queue/${id}/approve-reply`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`Approve reply failed: ${res.status}`);
}

export async function rejectReply(id: string, feedback?: string): Promise<string> {
  const res = await fetch(`${SCRAPER_BASE}/admin/langcliffe-queue/${id}/reject-reply`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ feedback }),
  });
  if (!res.ok) throw new Error(`Reject reply failed: ${res.status}`);
  const json = await res.json();
  return json.draft ?? '';
}

export async function approveAcknowledgment(id: string): Promise<void> {
  const res = await fetch(`${SCRAPER_BASE}/admin/langcliffe-queue/${id}/approve-ack`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`Approve acknowledgment failed: ${res.status}`);
}

export async function approveNDAReturn(id: string): Promise<void> {
  const res = await fetch(`${SCRAPER_BASE}/admin/langcliffe-queue/${id}/approve-nda-return`, {
    method: 'POST',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(`Approve NDA return failed: ${res.status}`);
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

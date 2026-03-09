const SCRAPER_BASE = import.meta.env.VITE_SCRAPER_URL as string;
const ADMIN_KEY = import.meta.env.VITE_SCRAPER_ADMIN_KEY as string;

export interface OutreachDraft {
  _id: string;
  listing_id_text: string;
  business_name_text: string;
  langcliffe_contact_text: string;
  user_user: string;
  draft_body_text: string;
  inbound_email_text?: string;
  reply_draft_text?: string;
  langcliffe_reply_body_text?: string;
  conversation_history_text?: string;
  nda_file_file?: string;
  signed_nda_file_file?: string;
  acknowledgment_draft_text?: string;
  nda_return_draft_text?: string;
  status_text: 'pending' | 'sent' | 'rejected' | 'pending_reply' | 'nda_received' | 'nda_acknowledged' | 'nda_signed' | 'nda_returned';
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

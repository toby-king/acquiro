/**
 * Admin dashboard API service.
 * Calls Bubble admin endpoints (you need to create these in Bubble) and our backend for MRR / ElevenLabs.
 * See docs/ADMIN_API.md for the Bubble contract.
 */

const BASE_URL = import.meta.env.VITE_BUBBLE_API_BASE_URL;
const API_TOKEN = import.meta.env.VITE_BUBBLE_API_TOKEN;

const PRODUCTION_BACKEND = 'https://acquiro-backend.vercel.app';
function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') return PRODUCTION_BACKEND;
  }
  return import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PRODUCTION_BACKEND : 'http://localhost:3001');
}
const BACKEND_URL = getBackendUrl();

// --- Bubble admin endpoints (create in Bubble to match this contract) ---

/**
 * GET /get_admin_stats → { total_users, active_subscribers, churned_users, ... }
 * Optional additions (Bubble endpoint can be updated to return these):
 *   signups_over_time: [{ date: string, count: number }]
 *   listings_by_source: [{ source: string, count: number }]
 *   listings_over_time: [{ date: string, by_source: { [source: string]: number } }]
 */
export interface AdminStatsResponse {
  total_users: number;
  active_subscribers: number;
  churned_users: number;
  /** New signups per period; Bubble to add when available */
  signups_over_time?: { date: string; count: number }[];
  /** Listings count per source; Bubble to add when available */
  listings_by_source?: { source: string; count: number }[];
  /** Listings added per period per source; Bubble to add when available */
  listings_over_time?: { date: string; by_source: Record<string, number> }[];
}

/**
 * Fetches admin user stats from Bubble.
 * Bubble endpoint: GET (or POST) /get_admin_stats — must return total_users, active_subscribers, churned_users.
 */
export async function getAdminStats(): Promise<AdminStatsResponse> {
  if (!API_TOKEN || !BASE_URL) throw new Error('Bubble API configuration is missing.');
  const url = `${BASE_URL.replace(/\/$/, '')}/get_admin_stats`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Admin get_stats failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { response?: AdminStatsResponse } & AdminStatsResponse;
  const out = data.response ?? data;
  if (typeof out.total_users !== 'number' || typeof out.active_subscribers !== 'number' || typeof out.churned_users !== 'number') {
    throw new Error('Invalid admin stats response shape');
  }
  return {
    total_users: out.total_users,
    active_subscribers: out.active_subscribers,
    churned_users: out.churned_users,
    signups_over_time: Array.isArray(out.signups_over_time) ? out.signups_over_time : undefined,
    listings_by_source: Array.isArray(out.listings_by_source) ? out.listings_by_source : undefined,
    listings_over_time: Array.isArray(out.listings_over_time) ? out.listings_over_time : undefined,
  };
}

/** Single listing row from get_listings */
export interface AdminListing {
  id: string;
  title: string;
  source: string;
  location: string | null;
  asking_price: number | null;
  date_added: string; // ISO date
  [key: string]: unknown;
}

/** GET /admin/get_listings?search=X&source=Y&page=1 → { listings, total_count, by_source? } */
export interface AdminListingsResponse {
  listings: AdminListing[];
  total_count: number;
  /** Optional: counts per source for summary cards */
  by_source?: { source: string; count: number }[];
}

export interface GetAdminListingsParams {
  search?: string;
  source?: string;
  page?: number;
  page_size?: number;
}

/**
 * Fetches paginated listings from Bubble.
 * Bubble endpoint: GET /admin/get_listings?search=X&source=Y&page=1 — must return listings[], total_count, optionally by_source.
 */
export async function getAdminListings(params: GetAdminListingsParams = {}): Promise<AdminListingsResponse> {
  if (!API_TOKEN || !BASE_URL) throw new Error('Bubble API configuration is missing.');
  const q = new URLSearchParams();
  if (params.search != null && params.search.trim() !== '') q.set('search', params.search.trim());
  if (params.source != null && params.source.trim() !== '') q.set('source', params.source.trim());
  if (params.page != null && params.page > 0) q.set('page', String(params.page));
  if (params.page_size != null && params.page_size > 0) q.set('page_size', String(params.page_size));
  const url = `${BASE_URL.replace(/\/$/, '')}/admin/get_listings?${q.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Admin get_listings failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { response?: AdminListingsResponse } & AdminListingsResponse;
  const out = data.response ?? data;
  if (!Array.isArray(out.listings) || typeof out.total_count !== 'number') {
    throw new Error('Invalid admin listings response shape');
  }
  return {
    listings: out.listings,
    total_count: out.total_count,
    by_source: out.by_source,
  };
}

// --- Backend (Stripe MRR, ElevenLabs) ---

export interface MrrResponse {
  mrr_cents: number;
  currency: string;
}

/** Fetches current MRR from our backend (Stripe). */
export async function getMrr(): Promise<MrrResponse> {
  const res = await fetch(`${BACKEND_URL}/api/admin/mrr`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch MRR' }));
    throw new Error(err.error || 'Failed to fetch MRR');
  }
  return res.json();
}

/** GET /api/admin/revenue → { current_mrr, monthly_revenue: [{ month, revenue }] } — revenue in cents */
export interface RevenueResponse {
  current_mrr: number;
  monthly_revenue: { month: string; revenue: number }[];
}

/** Fetches current MRR and last 6 months revenue from our backend (Stripe invoices + subscriptions). */
export async function getRevenue(): Promise<RevenueResponse> {
  const res = await fetch(`${BACKEND_URL}/api/admin/revenue`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch revenue' }));
    throw new Error(err.error || 'Failed to fetch revenue');
  }
  return res.json();
}

/** ElevenLabs conversation summary (from list). */
export interface ConversationSummary {
  conversation_id: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  message_count: number;
  status: string;
  call_successful?: string;
  transcript_summary?: string;
  agent_id?: string;
  agent_name?: string;
  [key: string]: unknown;
}

export interface ConversationsListResponse {
  conversations: ConversationSummary[];
  next_cursor?: string;
  has_more: boolean;
}

/** Fetches conversation list from our backend (ElevenLabs proxy). */
export async function getConversations(params: {
  cursor?: string;
  page_size?: number;
  agent_id?: string;
} = {}): Promise<ConversationsListResponse> {
  const q = new URLSearchParams();
  if (params.cursor) q.set('cursor', params.cursor);
  if (params.page_size != null) q.set('page_size', String(params.page_size));
  if (params.agent_id) q.set('agent_id', params.agent_id);
  const res = await fetch(`${BACKEND_URL}/api/admin/conversations?${q.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch conversations' }));
    throw new Error(err.error || 'Failed to fetch conversations');
  }
  return res.json();
}

/** Single conversation details (transcript etc.). */
export interface ConversationDetails {
  conversation_id: string;
  start_time_unix_secs?: number;
  call_duration_secs?: number;
  transcript?: Array<{ role: string; message: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

/** Fetches one conversation (with transcript) from our backend (ElevenLabs proxy). */
export async function getConversation(conversationId: string): Promise<ConversationDetails> {
  const res = await fetch(`${BACKEND_URL}/api/admin/conversations/${encodeURIComponent(conversationId)}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Conversation not found');
    const err = await res.json().catch(() => ({ error: 'Failed to fetch conversation' }));
    throw new Error(err.error || 'Failed to fetch conversation');
  }
  return res.json();
}

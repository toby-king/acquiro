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

/** Single listing row (normalized for admin UI) */
export interface AdminListing {
  id: string;
  title: string;
  source: string;
  location: string | null;
  asking_price: number | null;
  date_added: string; // ISO date
  [key: string]: unknown;
}

/** Raw listing item from Bubble GET /get_listings — response.response.listing[] */
interface BubbleListingRaw {
  _id?: string;
  business_name?: string;
  source?: string;
  location?: string;
  asking_price?: number;
  'Created Date'?: number;
  [key: string]: unknown;
}

function mapBubbleListingToAdmin(raw: BubbleListingRaw): AdminListing {
  const id = raw._id != null ? String(raw._id) : '';
  const title = raw.business_name != null ? String(raw.business_name).trim() : '';
  const source = raw.source != null ? String(raw.source) : '';
  const location =
    raw.location != null && String(raw.location).trim() !== '' ? String(raw.location).trim() : null;
  const asking_price =
    raw.asking_price != null && typeof raw.asking_price === 'number' ? raw.asking_price : null;
  const createdMs = raw['Created Date'];
  const date_added =
    createdMs != null && typeof createdMs === 'number'
      ? new Date(createdMs).toISOString()
      : new Date(0).toISOString();
  return {
    id,
    title,
    source,
    location,
    asking_price,
    date_added,
    ...raw,
  };
}

/** GET /get_listings → { status, response: { listing: [...] } }. Listing array may include total_count / by_source if Bubble adds them. */
export interface AdminListingsResponse {
  listings: AdminListing[];
  total_count: number;
  /** Counts per source for summary cards; derived from listing array when not in response */
  by_source?: { source: string; count: number }[];
}

export interface GetAdminListingsParams {
  search?: string;
  source?: string;
  page?: number;
  page_size?: number;
}

/**
 * Fetches listings from Bubble GET /get_listings.
 * Bubble returns { status, response: { listing: [...] } } with each item having _id, business_name, source, location, asking_price, Created Date, etc.
 */
export async function getAdminListings(params: GetAdminListingsParams = {}): Promise<AdminListingsResponse> {
  if (!API_TOKEN || !BASE_URL) throw new Error('Bubble API configuration is missing.');
  const q = new URLSearchParams();
  if (params.search != null && params.search.trim() !== '') q.set('search', params.search.trim());
  if (params.source != null && params.source.trim() !== '') q.set('source', params.source.trim());
  if (params.page != null && params.page > 0) q.set('page', String(params.page));
  if (params.page_size != null && params.page_size > 0) q.set('page_size', String(params.page_size));
  const url = `${BASE_URL.replace(/\/$/, '')}/get_listings?${q.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bubble get_listings failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as {
    status?: string;
    response?: {
      listing?: BubbleListingRaw[];
      listings?: BubbleListingRaw[];
      total_count?: number;
      by_source?: { source: string; count: number }[];
    };
  };
  const resp = data.response;
  const rawList = resp?.listing ?? resp?.listings ?? [];
  const rawArray = Array.isArray(rawList) ? rawList : [];
  const listings = rawArray.map(mapBubbleListingToAdmin);
  const total_count =
    typeof resp?.total_count === 'number' ? resp.total_count : listings.length;
  const by_source =
    Array.isArray(resp?.by_source) && resp.by_source.length > 0
      ? resp.by_source
      : (() => {
          const counts: Record<string, number> = {};
          listings.forEach((l) => {
            const s = l.source || 'Unknown';
            counts[s] = (counts[s] ?? 0) + 1;
          });
          return Object.entries(counts)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count);
        })();
  return {
    listings,
    total_count,
    by_source,
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

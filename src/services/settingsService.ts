/**
 * Settings service — reads/writes User, Agents, and Buyer_Info via the backend API.
 * All mutations are scoped to the authenticated user's own records only.
 */

const API_URL = import.meta.env.VITE_API_URL as string;

const PRODUCTION_BACKEND = 'https://acquiro-backend.vercel.app';
function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') return PRODUCTION_BACKEND;
  }
  return API_URL || (import.meta.env.PROD ? PRODUCTION_BACKEND : 'http://localhost:3001');
}
const BACKEND_URL = getBackendUrl();

/** Bubble workflow API wraps IDs in braces; strip them for Data API calls. */
function bareId(id: string): string {
  return id.replace(/^\{/, '').replace(/\}$/, '');
}

async function backendGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function backendPatch(path: string, body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${path} failed: ${res.status} ${text}`);
  }
}

// ─── User profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  _id: string;
  name_text?: string;
  email?: string;
  langcliffe_connected_boolean?: boolean;
}

interface RawUserResponse {
  _id: string;
  name_text?: string;
  authentication?: { email?: { email?: string } };
  [key: string]: unknown;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const data = await backendGet<{ response: RawUserResponse }>(
    `/api/bubble/settings/user/${bareId(userId)}`,
  );
  const raw = data.response;
  return {
    _id: raw._id,
    name_text: raw.name_text,
    email: raw.authentication?.email?.email,
    langcliffe_connected_boolean: raw.langcliffe_connected_boolean as boolean | undefined,
  };
}

export async function updateUserProfile(
  userId: string,
  fields: { name_text?: string; langcliffe_connected_boolean?: boolean },
): Promise<void> {
  await backendPatch(`/api/bubble/settings/user/${bareId(userId)}`, fields as Record<string, unknown>);
}

// ─── Agent ─────────────────────────────────────────────────────────────────────

export interface AgentRecord {
  _id: string;
  name_text?: string;
  email_text?: string;
}

export async function getMyAgent(userId: string): Promise<AgentRecord | null> {
  const data = await backendGet<{ response: { results: AgentRecord[] } }>(
    `/api/bubble/settings/agent/${bareId(userId)}`,
  );
  return data.response.results[0] ?? null;
}

export async function updateAgent(
  agentId: string,
  fields: { name_text?: string; email_text?: string },
): Promise<void> {
  await backendPatch(`/api/bubble/settings/agent/${bareId(agentId)}`, fields as Record<string, unknown>);
}

// ─── Buyer info ────────────────────────────────────────────────────────────────

export interface BuyerInfoRecord {
  _id: string;
  company_overview_text?: string;
  geography_text?: string;
  funding_source_text?: string;
  ebitda_range_text?: string;
  turnover_range_text?: string;
  max_investment_number?: number;
  industry_preferences_list_option_sectors?: string[];
  excluded_sectors_list_option_sectors?: string[];
  langcliffe_contact_email_text?: string;
  [key: string]: unknown;
}

export async function getMyBuyerInfo(userId: string): Promise<BuyerInfoRecord | null> {
  const data = await backendGet<{ response: { results: BuyerInfoRecord[] } }>(
    `/api/bubble/settings/buyer-info/${bareId(userId)}`,
  );
  return data.response.results[0] ?? null;
}

export async function updateBuyerInfo(
  buyerInfoId: string,
  fields: Partial<Omit<BuyerInfoRecord, '_id'>>,
): Promise<void> {
  await backendPatch(
    `/api/bubble/settings/buyer-info/${bareId(buyerInfoId)}`,
    fields as Record<string, unknown>,
  );
}

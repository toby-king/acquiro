/**
 * Settings service — reads/writes User, Agents, and Buyer_Info directly via the Bubble Data API.
 * All mutations are scoped to the authenticated user's own records only.
 */

const BASE_URL = import.meta.env.VITE_BUBBLE_API_BASE_URL as string;
const API_TOKEN = import.meta.env.VITE_BUBBLE_API_TOKEN as string;
const DATA_BASE = BASE_URL ? BASE_URL.replace(/\/wf(\/.*)?$/, '/obj') : '';

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${API_TOKEN}` };
}

/** Bubble workflow API wraps IDs in braces; the Data API requires the bare ID. */
function bareId(id: string): string {
  return id.replace(/^\{/, '').replace(/\}$/, '');
}

async function dataGet<T>(path: string): Promise<T> {
  const res = await fetch(`${DATA_BASE}${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function dataPatch(path: string, body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${DATA_BASE}${path}`, {
    method: 'PATCH',
    headers: headers(),
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
  email?: string; // read-only — lives in authentication.email.email
  langcliffe_connected_boolean?: boolean;
}

interface RawUserResponse {
  _id: string;
  name_text?: string;
  authentication?: { email?: { email?: string } };
  [key: string]: unknown;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const data = await dataGet<{ response: RawUserResponse }>(`/User/${bareId(userId)}`);
  const raw = data.response;
  return {
    _id: raw._id,
    name_text: raw.name_text,
    email: raw.authentication?.email?.email,
    langcliffe_connected_boolean: raw.langcliffe_connected_boolean as boolean | undefined,
  };
}

export async function updateUserProfile(userId: string, fields: { name_text?: string; langcliffe_connected_boolean?: boolean }): Promise<void> {
  await dataPatch(`/User/${bareId(userId)}`, fields as Record<string, unknown>);
}

// ─── Agent ─────────────────────────────────────────────────────────────────────

export interface AgentRecord {
  _id: string;
  name_text?: string;
  email_text?: string;
}

export async function getMyAgent(userId: string): Promise<AgentRecord | null> {
  const constraints = encodeURIComponent(
    JSON.stringify([{ key: 'user_user', constraint_type: 'equals', value: bareId(userId) }]),
  );
  const data = await dataGet<{ response: { results: AgentRecord[] } }>(
    `/Agents?constraints=${constraints}`,
  );
  return data.response.results[0] ?? null;
}

export async function updateAgent(agentId: string, fields: { name_text?: string; email_text?: string }): Promise<void> {
  await dataPatch(`/Agents/${bareId(agentId)}`, fields as Record<string, unknown>);
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
  [key: string]: unknown;
}

export async function getMyBuyerInfo(userId: string): Promise<BuyerInfoRecord | null> {
  const constraints = encodeURIComponent(
    JSON.stringify([{ key: 'user_user', constraint_type: 'equals', value: bareId(userId) }]),
  );
  const data = await dataGet<{ response: { results: BuyerInfoRecord[] } }>(
    `/Buyer_Info?constraints=${constraints}`,
  );
  return data.response.results[0] ?? null;
}

export async function updateBuyerInfo(
  buyerInfoId: string,
  fields: Partial<Omit<BuyerInfoRecord, '_id'>>,
): Promise<void> {
  await dataPatch(`/Buyer_Info/${bareId(buyerInfoId)}`, fields as Record<string, unknown>);
}

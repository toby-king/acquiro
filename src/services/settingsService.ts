/**
 * Settings service — reads/writes User, Agents, and Buyer_Info via the backend API.
 * All mutations are scoped to the authenticated user's own records only.
 */

import { API_URL } from '../utils/apiUrl';

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
  id: string;
  name?: string;
  email?: string;
  langcliffe_connected?: boolean;
}

interface RawUserResponse {
  id: string;
  name?: string;
  email?: string;
  langcliffe_connected?: boolean;
  [key: string]: unknown;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const data = await backendGet<{ response: RawUserResponse }>(
    `/api/bubble/settings/user/${bareId(userId)}`,
  );
  const raw = data.response;
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    langcliffe_connected: raw.langcliffe_connected,
  };
}

export async function updateUserProfile(
  userId: string,
  fields: { name?: string; langcliffe_connected?: boolean },
): Promise<void> {
  await backendPatch(`/api/bubble/settings/user/${bareId(userId)}`, fields as Record<string, unknown>);
}

// ─── Agent ─────────────────────────────────────────────────────────────────────

export interface AgentRecord {
  id: string;
  name?: string;
  email?: string;
}

export async function getMyAgent(userId: string): Promise<AgentRecord | null> {
  const data = await backendGet<{ response: { results: AgentRecord[] } }>(
    `/api/bubble/settings/agent/${bareId(userId)}`,
  );
  return data.response.results[0] ?? null;
}

export async function updateAgent(
  agentId: string,
  fields: { name?: string; email?: string },
): Promise<void> {
  await backendPatch(`/api/bubble/settings/agent/${bareId(agentId)}`, fields as Record<string, unknown>);
}

// ─── Buyer info ────────────────────────────────────────────────────────────────

export interface BuyerInfoRecord {
  id: string;
  company_overview?: string;
  geography?: string;
  funding_source?: string;
  ebitda_range?: string;
  turnover_range?: string;
  initial_budget?: number;
  industry_preferences?: string[];
  excluded_sectors?: string[];
  langcliffe_contact_email?: string;
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
  fields: Partial<Omit<BuyerInfoRecord, 'id'>>,
): Promise<void> {
  await backendPatch(
    `/api/bubble/settings/buyer-info/${bareId(buyerInfoId)}`,
    fields as Record<string, unknown>,
  );
}

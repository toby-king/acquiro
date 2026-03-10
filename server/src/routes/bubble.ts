/**
 * Backend proxy for all Bubble data operations.
 *
 * Every frontend Bubble call routes through here so that BUBBLE_API_KEY
 * never leaves the server. When we migrate to Supabase the implementations
 * in this file change; the frontend route contract stays the same.
 *
 * Endpoints that call wf/ (workflow API) are marked TODO — they'll be
 * replaced with direct /obj/ calls once Bubble field names are confirmed.
 */

import { Router, Request, Response } from 'express';

const router = Router();

const BUBBLE_BASE = 'https://toby-85612.bubbleapps.io/version-test/api/1.1';

function getApiKey(): string {
  const key = process.env.BUBBLE_API_KEY;
  if (!key) throw new Error('BUBBLE_API_KEY is not configured');
  return key;
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getApiKey()}`,
  };
}

async function bubbleGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${BUBBLE_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Bubble GET ${path} failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function bubblePatch(path: string, body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${BUBBLE_BASE}${path}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Bubble PATCH ${path} failed: ${res.status} ${text.slice(0, 200)}`);
  }
}

async function bubblePost<T = unknown>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BUBBLE_BASE}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Bubble POST ${path} failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

function enc(constraints: unknown): string {
  return encodeURIComponent(JSON.stringify(constraints));
}

type Handler = (req: Request, res: Response) => Promise<void>;
function wrap(handler: Handler) {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error('[bubble]', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  };
}

// ── USER ──────────────────────────────────────────────────────────────────────

/** GET /api/bubble/user/:userId — get user profile by ID */
router.get('/user/:userId', wrap(async (req, res) => {
  const data = await bubbleGet<{ response: Record<string, unknown> }>(`/obj/user/${req.params.userId}`);
  const u = data.response;
  const auth = u.authentication as { email?: { email?: string } } | undefined;
  res.json({
    user_id: u._id,
    name: (u.name_text ?? u.name) as string | null ?? null,
    email: auth?.email?.email ?? null,
    is_subscribed: (u.is_subscribed_boolean ?? false) as boolean,
    subscription_id: (u.subscription_id_text ?? null) as string | null,
    cancel_at: (u.cancel_at_text ?? null) as string | null,
    is_admin: (u.is_admin_boolean ?? false) as boolean,
  });
}));

/** POST /api/bubble/user/lookup — find user by email */
router.post('/user/lookup', wrap(async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email?.trim()) { res.status(400).json({ error: 'email required' }); return; }
  const constraints = enc([{ key: 'authentication.email.email', constraint_type: 'equals', value: email.trim() }]);
  const data = await bubbleGet<{ response: { results: Record<string, unknown>[] } }>(
    `/obj/user?constraints=${constraints}&limit=1`,
  );
  const u = data.response.results[0];
  if (!u) { res.status(404).json({ error: 'ACCOUNT_NOT_FOUND' }); return; }
  const auth = u.authentication as { email?: { email?: string } } | undefined;
  res.json({
    user_id: u._id,
    name: (u.name_text ?? u.name) as string | null ?? null,
    email: auth?.email?.email ?? null,
  });
}));

/** PATCH /api/bubble/user/:userId — update user fields */
router.patch('/user/:userId', wrap(async (req, res) => {
  await bubblePatch(`/obj/user/${req.params.userId}`, req.body as Record<string, unknown>);
  res.json({ ok: true });
}));

/** POST /api/bubble/user/account — create a Bubble user from a lead (TODO: replace wf/) */
router.post('/user/account', wrap(async (req, res) => {
  const data = await bubblePost('/wf/create_user', req.body as Record<string, unknown>);
  res.json(data);
}));

// ── LEAD ──────────────────────────────────────────────────────────────────────

/** POST /api/bubble/lead — create a lead (TODO: replace wf/) */
router.post('/lead', wrap(async (req, res) => {
  const data = await bubblePost('/wf/create_lead', req.body as Record<string, unknown>);
  res.json(data);
}));

/** POST /api/bubble/lead/mail — send retention email to lead (TODO: replace wf/) */
router.post('/lead/mail', wrap(async (req, res) => {
  const data = await bubblePost('/wf/send_lead_mail', req.body as Record<string, unknown>);
  res.json(data);
}));

// ── AGENT ─────────────────────────────────────────────────────────────────────

/** GET /api/bubble/agent/email-check?email=... — check if agent email is taken */
router.get('/agent/email-check', wrap(async (req, res) => {
  const email = req.query.email as string | undefined;
  if (!email) { res.status(400).json({ error: 'email required' }); return; }
  const constraints = enc([{ key: 'email_text', constraint_type: 'equals', value: email }]);
  const data = await bubbleGet<{ response: { count?: number } }>(
    `/obj/Agents?constraints=${constraints}&limit=1`,
  );
  res.json({ taken: (data.response?.count ?? 0) > 0 });
}));

/** GET /api/bubble/agent?lead_id=... — get agent by lead ID (TODO: replace wf/) */
router.get('/agent', wrap(async (req, res) => {
  const leadId = req.query.lead_id as string | undefined;
  if (!leadId) { res.status(400).json({ error: 'lead_id required' }); return; }
  const data = await bubblePost<unknown>('/wf/get_agent', { lead_id: leadId });
  res.json(data);
}));

/** POST /api/bubble/agent — create agent (TODO: replace wf/) */
router.post('/agent', wrap(async (req, res) => {
  const data = await bubblePost('/wf/create_agent', req.body as Record<string, unknown>);
  res.json(data);
}));

// ── BUYER INFO ────────────────────────────────────────────────────────────────

/** GET /api/bubble/buyer-info/:userId — get buyer info for a user */
router.get('/buyer-info/:userId', wrap(async (req, res) => {
  const constraints = enc([{ key: 'user_user', constraint_type: 'equals', value: req.params.userId }]);
  const data = await bubbleGet<{ response: { results: Record<string, unknown>[] } }>(
    `/obj/Buyer_Info?constraints=${constraints}&limit=1`,
  );
  const info = data.response.results[0];
  if (!info) { res.status(404).json({ error: 'Buyer info not found' }); return; }
  res.json({ response: info });
}));

// ── MATCHES ───────────────────────────────────────────────────────────────────

/** GET /api/bubble/matches/:userId — top matches with business details */
router.get('/matches/:userId', wrap(async (req, res) => {
  const { userId } = req.params;
  const constraints = enc([
    { key: 'user_user', constraint_type: 'equals', value: userId },
    { key: 'dismissed_boolean', constraint_type: 'is not', value: true },
  ]);
  const matchesData = await bubbleGet<{ response: { results: Record<string, unknown>[] } }>(
    `/obj/matches?constraints=${constraints}&sort_field=score_number&descending=true&limit=10`,
  );

  const enriched = await Promise.all(
    matchesData.response.results.map(async (m) => {
      const businessId = m.business_custom_business as string;
      if (!businessId) return null;
      try {
        const bData = await bubbleGet<{ response: Record<string, unknown> }>(`/obj/Business/${businessId}`);
        const b = bData.response;
        const imageRaw = ((b.image_image ?? '') as string);
        const firstImageUrl = imageRaw.split(',')[0]?.trim();
        return {
          id: m._id as string,
          matchId: m._id as string,
          companyName: (b.business_name_text as string) ?? 'Unknown Business',
          description: (b.description_text as string) ?? '',
          status: null,
          thumbnail: firstImageUrl?.startsWith('http') ? firstImageUrl : null,
        };
      } catch {
        return null;
      }
    }),
  );

  res.json({ matches: enriched.filter(Boolean) });
}));

/** PATCH /api/bubble/matches/:matchId/dismiss — dismiss a match */
router.patch('/matches/:matchId/dismiss', wrap(async (req, res) => {
  await bubblePatch(`/obj/matches/${req.params.matchId}`, { dismissed_boolean: true });
  res.json({ ok: true });
}));

// ── ADMIN ─────────────────────────────────────────────────────────────────────

/** GET /api/bubble/admin/stats — user/subscriber counts (TODO: replace wf/) */
router.get('/admin/stats', wrap(async (req, res) => {
  const fetchRes = await fetch(`${BUBBLE_BASE}/wf/get_admin_stats`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });
  if (!fetchRes.ok) { res.status(fetchRes.status).json({ error: 'Failed to fetch admin stats' }); return; }
  const data = await fetchRes.json();
  res.json(data);
}));

/** GET /api/bubble/listings?cursor=0&limit=100 — passthrough for admin listings */
router.get('/listings', wrap(async (req, res) => {
  const cursor = (req.query.cursor as string) ?? '0';
  const limit = (req.query.limit as string) ?? '100';
  const data = await bubbleGet(`/obj/Business?limit=${limit}&cursor=${cursor}`);
  res.json(data);
}));

// ── SETTINGS ──────────────────────────────────────────────────────────────────

router.get('/settings/user/:userId', wrap(async (req, res) => {
  const data = await bubbleGet(`/obj/User/${req.params.userId}`);
  res.json(data);
}));

router.patch('/settings/user/:userId', wrap(async (req, res) => {
  await bubblePatch(`/obj/User/${req.params.userId}`, req.body as Record<string, unknown>);
  res.json({ ok: true });
}));

router.get('/settings/agent/:userId', wrap(async (req, res) => {
  const constraints = enc([{ key: 'user_user', constraint_type: 'equals', value: req.params.userId }]);
  const data = await bubbleGet(`/obj/Agents?constraints=${constraints}`);
  res.json(data);
}));

router.patch('/settings/agent/:agentId', wrap(async (req, res) => {
  await bubblePatch(`/obj/Agents/${req.params.agentId}`, req.body as Record<string, unknown>);
  res.json({ ok: true });
}));

router.get('/settings/buyer-info/:userId', wrap(async (req, res) => {
  const constraints = enc([{ key: 'user_user', constraint_type: 'equals', value: req.params.userId }]);
  const data = await bubbleGet(`/obj/Buyer_Info?constraints=${constraints}`);
  res.json(data);
}));

router.patch('/settings/buyer-info/:buyerInfoId', wrap(async (req, res) => {
  await bubblePatch(`/obj/Buyer_Info/${req.params.buyerInfoId}`, req.body as Record<string, unknown>);
  res.json({ ok: true });
}));

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

router.get('/notifications/nda/:outreachId', wrap(async (req, res) => {
  const data = await bubbleGet<{ response?: { nda_file_text?: string } }>(
    `/obj/LangcliffeOutreach/${req.params.outreachId}`,
  );
  res.json({ nda_file_url: data.response?.nda_file_text ?? null });
}));

router.get('/notifications/:userId', wrap(async (req, res) => {
  const constraints = enc([
    { key: 'user_user', constraint_type: 'equals', value: req.params.userId },
    { key: 'status_text', constraint_type: 'equals', value: 'unread' },
  ]);
  const data = await bubbleGet(
    `/obj/UserNotification?constraints=${constraints}&sort_field=Created Date&descending=true`,
  );
  res.json(data);
}));

router.patch('/notifications/:notificationId/action', wrap(async (req, res) => {
  await bubblePatch(`/obj/UserNotification/${req.params.notificationId}`, { status_text: 'actioned' });
  res.json({ ok: true });
}));

export default router;

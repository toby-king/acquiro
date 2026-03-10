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

/** POST /api/bubble/user/account — create a Bubble auth user from a lead */
router.post('/user/account', wrap(async (req, res) => {
  const { lead_id, subscription_id } = req.body as { lead_id?: string; subscription_id?: string };
  if (!lead_id) { res.status(400).json({ error: 'lead_id required' }); return; }

  // 1. Fetch lead to get email + name
  const leadData = await bubbleGet<{ response: { name_text?: string; email_text?: string } }>(
    `/obj/Lead/${lead_id}`,
  );
  const lead = leadData.response;
  if (!lead.email_text) throw new Error(`Lead ${lead_id} has no email_text`);

  // 2. Create Bubble auth user
  const userData = await bubblePost<{ id?: string }>('/obj/user', { email: lead.email_text });
  const userId = userData.id;
  if (!userId) throw new Error('Bubble /obj/user POST did not return an id');

  // 3. Set name + subscription fields
  const userFields: Record<string, unknown> = {};
  if (lead.name_text) userFields.name_text = lead.name_text;
  if (subscription_id) {
    userFields.subscription_id_text = subscription_id;
    userFields.is_subscribed_boolean = true;
  }
  if (Object.keys(userFields).length > 0) {
    await bubblePatch(`/obj/user/${userId}`, userFields);
  }

  // 4. Link the agent to the new user (non-fatal)
  try {
    const agentConstraints = enc([{ key: 'lead_custom_leads', constraint_type: 'equals', value: lead_id }]);
    const agentData = await bubbleGet<{ response: { results: { _id: string }[] } }>(
      `/obj/Agents?constraints=${agentConstraints}&limit=1`,
    );
    const agent = agentData.response.results[0];
    if (agent?._id) {
      await bubblePatch(`/obj/Agents/${agent._id}`, { user_user: userId });
    }
  } catch (err) {
    console.warn('[bubble] create_user: agent link failed (non-fatal):', (err as Error).message);
  }

  // 5. Mark lead as converted (non-fatal)
  try {
    await bubblePatch(`/obj/Lead/${lead_id}`, { converted_boolean: true });
  } catch (err) {
    console.warn('[bubble] create_user: lead converted flag failed (non-fatal):', (err as Error).message);
  }

  console.log(`[bubble] create_user: created user ${userId} from lead ${lead_id}`);
  res.json({ status: 'success', response: { user_id: userId } });
}));

// ── LEAD ──────────────────────────────────────────────────────────────────────

/** POST /api/bubble/lead — create a lead */
router.post('/lead', wrap(async (req, res) => {
  const { name, email } = req.body as { name?: string; email?: string };
  if (!name?.trim() || !email?.trim()) { res.status(400).json({ error: 'name and email required' }); return; }
  const data = await bubblePost<{ id?: string }>('/obj/Lead', {
    name_text: name.trim(),
    email_text: email.trim(),
  });
  // Match the shape the frontend expects: { response: { lead_id } }
  res.json({ status: 'success', response: { lead_id: data.id } });
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

/** GET /api/bubble/agent?lead_id=... — get agent by lead ID */
router.get('/agent', wrap(async (req, res) => {
  const leadId = req.query.lead_id as string | undefined;
  if (!leadId) { res.status(400).json({ error: 'lead_id required' }); return; }

  const constraints = enc([{ key: 'lead_custom_leads', constraint_type: 'equals', value: leadId }]);
  const data = await bubbleGet<{ response: { results: Record<string, unknown>[] } }>(
    `/obj/Agents?constraints=${constraints}&limit=1`,
  );
  const agent = data.response.results[0];
  if (!agent) { res.status(404).json({ error: 'Agent not found' }); return; }

  // Fetch linked user for user_name + user_email
  let userName: string | null = null;
  let userEmail: string | null = null;
  const userId = agent.user_user as string | undefined;
  if (userId) {
    try {
      const uData = await bubbleGet<{ response: Record<string, unknown> }>(`/obj/user/${userId}`);
      const u = uData.response;
      userName = (u.name_text ?? u.name) as string | null ?? null;
      userEmail = ((u.authentication as { email?: { email?: string } } | undefined)?.email?.email) ?? null;
    } catch { /* non-fatal — user might not exist yet */ }
  }

  // Map Data API field names to the shape getAgentService.ts expects
  res.json({
    response: {
      name: agent.name_text ?? null,
      challenge_style: agent.style_text ?? null,
      profanity: agent.profanity_boolean === true ? 'true' : 'false',
      traits: agent.traits_text ?? '',
      type: agent.type_text ?? null,
      voice: agent.voice_text ?? null,
      personality: agent.personality_options_option_personalityoptions ?? null,
      user_name: userName,
      user_email: userEmail,
    },
  });
}));

/** POST /api/bubble/agent — create agent */
router.post('/agent', wrap(async (req, res) => {
  const { lead_id, name, email, challenge_style, profanity, traits, type, voice, personality } =
    req.body as Record<string, string>;

  const body: Record<string, unknown> = {
    lead_custom_leads: lead_id,
    name_text: name,
    email_text: email,
    style_text: challenge_style,
    profanity_boolean: profanity === 'true',
    type_text: type,
    voice_text: voice,
  };
  if (traits) body.traits_text = traits;
  // Only set the option set field for preset personalities (not custom stats strings)
  if (personality && !personality.includes(': ')) {
    body.personality_options_option_personalityoptions = personality;
  }

  const data = await bubblePost<{ id?: string }>('/obj/Agents', body);
  res.json({ status: 'success', id: data.id });
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

/** GET /api/bubble/admin/stats — user/subscriber counts */
router.get('/admin/stats', wrap(async (req, res) => {
  const subscribedConstraints = enc([{ key: 'is_subscribed_boolean', constraint_type: 'equals', value: true }]);

  const [totalData, activeData] = await Promise.all([
    bubbleGet<{ response: { count: number; remaining: number } }>('/obj/user?limit=1'),
    bubbleGet<{ response: { count: number; remaining: number } }>(
      `/obj/user?constraints=${subscribedConstraints}&limit=1`,
    ),
  ]);

  const total_users = (totalData.response.count ?? 0) + (totalData.response.remaining ?? 0);
  const active_subscribers = (activeData.response.count ?? 0) + (activeData.response.remaining ?? 0);
  const churned_users = Math.max(0, total_users - active_subscribers);

  res.json({ total_users, active_subscribers, churned_users });
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

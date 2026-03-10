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
import OpenAI from 'openai';

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
  const normalised = email.trim().toLowerCase();
  let cursor = 0;
  while (true) {
    const data = await bubbleGet<{ response: { results: Array<{ _id: string; name_text?: string; authentication?: { email?: { email?: string } } }>; remaining: number } }>(
      `/obj/user?limit=100&cursor=${cursor}`,
    );
    const { results, remaining } = data.response;
    const u = results.find(r => r.authentication?.email?.email?.toLowerCase() === normalised);
    if (u) { res.json({ user_id: u._id, name: u.name_text ?? null, email: u.authentication?.email?.email ?? normalised }); return; }
    if (remaining <= 0) break;
    cursor += results.length;
  }
  res.status(404).json({ error: 'ACCOUNT_NOT_FOUND' });
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

  // 3. Set name, role + subscription fields
  const userFields: Record<string, unknown> = { role_text: 'buyer' };
  if (lead.name_text) userFields.name_text = lead.name_text;
  if (subscription_id) {
    userFields.subscription_id_text = subscription_id;
    userFields.is_subscribed_boolean = true;
  }
  if (Object.keys(userFields).length > 0) {
    await bubblePatch(`/obj/user/${userId}`, userFields);
  }

  // 4. Link agent + Buyer_Info to the new user (non-fatal)
  const leadConstraints = enc([{ key: 'lead_custom_leads', constraint_type: 'equals', value: lead_id }]);
  await Promise.all([
    bubbleGet<{ response: { results: { _id: string }[] } }>(
      `/obj/Agents?constraints=${leadConstraints}&limit=1`,
    ).then(async (agentData) => {
      const agent = agentData.response.results[0];
      if (agent?._id) await bubblePatch(`/obj/Agents/${agent._id}`, { user_user: userId });
    }).catch((err) => {
      console.warn('[bubble] create_user: agent link failed (non-fatal):', (err as Error).message);
    }),
    bubbleGet<{ response: { results: { _id: string }[] } }>(
      `/obj/Buyer_Info?constraints=${leadConstraints}&limit=1`,
    ).then(async (buyerData) => {
      const buyerInfo = buyerData.response.results[0];
      if (buyerInfo?._id) await bubblePatch(`/obj/Buyer_Info/${buyerInfo._id}`, { user_user: userId });
    }).catch((err) => {
      console.warn('[bubble] create_user: buyer_info link failed (non-fatal):', (err as Error).message);
    }),
  ]);

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

/** POST /api/bubble/lead — create a lead + linked Buyer_Info */
router.post('/lead', wrap(async (req, res) => {
  const { name, email } = req.body as { name?: string; email?: string };
  if (!name?.trim() || !email?.trim()) { res.status(400).json({ error: 'name and email required' }); return; }
  const data = await bubblePost<{ id?: string }>('/obj/Lead', {
    name_text: name.trim(),
    email_text: email.trim(),
  });
  const leadId = data.id;
  if (!leadId) throw new Error('Bubble /obj/Lead POST did not return an id');

  // Create the linked Buyer_Info record (non-fatal if it fails)
  try {
    await bubblePost('/obj/Buyer_Info', { lead_custom_leads: leadId });
  } catch (err) {
    console.warn('[bubble] create_lead: Buyer_Info creation failed (non-fatal):', (err as Error).message);
  }

  // Match the shape the frontend expects: { response: { lead_id } }
  res.json({ status: 'success', response: { lead_id: leadId } });
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

const BUYER_INFO_EXTRACTION_PROMPT = `You are a data extraction assistant for Acquiro, an AI-powered M&A advisory platform. Your job is to extract buyer preference data from conversation transcripts.

You will receive:
1. The buyer's CURRENT profile (may be empty for new users)
2. A conversation transcript or message exchange

Return a JSON object containing ALL fields listed below. For each field:
- If the conversation contains NEW or UPDATED information, return the new value.
- If the field already has a value in the current profile and nothing changed, return the EXISTING value.
- If the field has no value and was not mentioned, return an empty string "".
- NEVER return null. Always return either a value or "".
- For industry_preferences and excluded_sectors: return an empty array [] instead of "" if not applicable.

IMPORTANT RULES:
- industry_preferences and excluded_sectors MUST use the exact values from the allowed list below. If the user mentions a general area, map it to the closest matching sector. Return these as arrays.
- For industry_preferences and excluded_sectors: ALWAYS return the COMPLETE list — merge any new sectors with existing ones from the current profile. Only remove a sector if the user explicitly says they are no longer interested in it.
- For numeric ranges (turnover, EBITDA, valuation), use a consistent format: "£X-£Y" or "£X+" or "Up to £X"
- If the user is vague, capture what they said naturally rather than forcing it into a rigid format. E.g. "somewhere in the Midlands" → geography: "Midlands"
- If the user contradicts something in their current profile, return the NEW value.
- Never infer or assume — only extract what was explicitly stated or clearly implied.
- NEVER fabricate or guess values. If a field was never mentioned in any conversation and has no existing value, return "". Do not fill in plausible-sounding defaults.

ALLOWED SECTORS (use these exact strings for industry_preferences and excluded_sectors):

- Agriculture & Natural Resources (includes: Agriculture & Farming, Forestry & Timber, Fishing & Aquaculture, Mining & Quarrying, Energy & Utilities)
- Manufacturing & Industrial (includes: Food & Beverage Manufacturing, Industrial & Heavy Manufacturing, Automotive, Aerospace & Transport Equipment, Chemicals, Materials & Pharmaceuticals, Consumer & Durable Goods Manufacturing)
- Construction & Property (includes: Residential & Commercial Construction, Property Development, Real Estate Sales & Lettings, Property & Facilities Management, Architecture & Surveying)
- Wholesale, Retail & E-Commerce (includes: High-Street & Physical Retail, Online & Direct-to-Consumer, Wholesale & Distribution, Supermarkets & Convenience, Motor Trade & Parts)
- Transport & Logistics (includes: Road, Rail & Freight Transport, Warehousing & Storage, Courier & Last-Mile Delivery, Aviation & Maritime, Logistics & Supply Chain Services)
- Hospitality, Leisure & Tourism (includes: Cafés, Restaurants & Takeaways, Pubs, Bars & Nightlife, Hotels & Accommodation, Travel & Tourism Services, Events, Attractions & Entertainment)
- Technology & Digital (includes: Software & SaaS, IT Services & Consulting, Data, AI & Analytics, Fintech & Digital Payments, Telecommunications & Hardware)
- Financial & Professional Services (includes: Accounting & Tax, Legal & Compliance, Banking, Insurance & Financial Services, Consulting & Advisory, Recruitment & HR Services)
- Health, Education & Social Care (includes: Healthcare & Medical Services, Care Homes & Social Care, Mental Health & Wellbeing, Education & Training, Life Sciences & MedTech)
- Creative, Media & Consumer Services (includes: Marketing, Advertising & Design, Media, Publishing & Content, Arts, Culture & Heritage, Personal & Lifestyle Services, Sports, Fitness & Recreation)

IMPORTANT: Always return the HIGH-LEVEL sector name (e.g. "Hospitality, Leisure & Tourism"), never the sub-sector. Use the sub-sectors only to determine which high-level sector a user's interest maps to. For example, if a user says "care homes", return "Health, Education & Social Care".

You MUST return ALL of the following fields in every response:

- buyer_type: text — "Individual", "Corporate", "Private Equity", "Family Office", "Search Fund", etc.
- buying_reason: text — "Strategic" or "Financial" or brief explanation
- buying_experience: text — "New", "Intermediate", "Experienced" or brief description
- decision_speed: text — Timeline for making offers, e.g. "3-6 months", "Ready immediately"
- industry_preferences: array of strings — MUST match allowed sectors list exactly
- excluded_sectors: array of strings — MUST match allowed sectors list exactly
- geography: text — Country, region, city, or radius e.g. "Within 50 miles of Manchester"
- turnover_range: text — e.g. "£1M-£5M"
- ebitda_range: text — e.g. "£500K-£2M"
- ebitda_margin_min: text — e.g. "> 10%", "> 15%"
- asset_base: text — What assets they want, e.g. "Freehold property and equipment"
- valuation_range: text — Enterprise value or asking price range, e.g. "£2M-£8M"
- deal_structure_preferences: text — e.g. "Full buyout, open to earn-out"
- funding_source: text — e.g. "Cash buyer", "Bank-funded", "Investor-backed"
- business_age: text — e.g. "Mature, 10+ years", "5+ years established"
- employee_headcount: text — e.g. "10-50", "Under 20"
- customer_base_type: text — "B2B", "B2C", "B2G", or combination
- contractual_recurrence: text — e.g. "Recurring revenue preferred", ">70% recurring"
- ip_technology: text — e.g. "Proprietary software required", "Patents preferred"
- physical_digital: text — e.g. "Online only", "Brick and mortar", "Hybrid"
- involvement: text — How involved the buyer wants to be, e.g. "Hands-on operator", "Semi-absentee", "Absentee"
- problems: text — Problems the buyer has experienced with the acquisition process, e.g. "Struggling to find quality deal flow", "Too many irrelevant listings"

Return ONLY valid JSON with all 22 fields. No markdown, no explanation, no wrapping.`;

/** POST /api/bubble/buyer-info/extract — fetch ElevenLabs transcript, extract buyer info, update Buyer_Info */
router.post('/buyer-info/extract', wrap(async (req, res) => {
  const { userId, conversationId } = req.body as { userId?: string; conversationId?: string };
  if (!userId || !conversationId) {
    res.status(400).json({ error: 'userId and conversationId are required' });
    return;
  }

  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  if (!elevenLabsKey) throw new Error('ELEVENLABS_API_KEY not configured');

  // 1. Fetch transcript from ElevenLabs
  const transcriptRes = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
    { headers: { 'xi-api-key': elevenLabsKey } },
  );
  if (!transcriptRes.ok) {
    const text = await transcriptRes.text().catch(() => '');
    throw new Error(`ElevenLabs transcript fetch failed: ${transcriptRes.status} ${text.slice(0, 200)}`);
  }
  const transcriptData = await transcriptRes.json() as {
    transcript?: Array<{ role: string; message: string }>;
  };

  const messages = transcriptData.transcript ?? [];
  if (messages.length === 0) {
    console.log(`[bubble] buyer-info extract: empty transcript for conversation ${conversationId} — skipping`);
    res.json({ ok: true, message: 'Empty transcript — skipping extraction' });
    return;
  }

  const transcriptText = messages
    .map((m) => `${m.role}: ${m.message}`)
    .join('\n');

  // 2. Get current Buyer_Info record
  const constraints = enc([{ key: 'user_user', constraint_type: 'equals', value: userId }]);
  const buyerData = await bubbleGet<{ response: { results: Record<string, unknown>[] } }>(
    `/obj/Buyer_Info?constraints=${constraints}&limit=1`,
  );
  const buyerInfo = buyerData.response.results[0];
  if (!buyerInfo) {
    res.status(404).json({ error: 'Buyer_Info not found for this user' });
    return;
  }

  // 3. Build current profile to pass alongside transcript
  const currentProfile = {
    buyer_type:                  buyerInfo.buyer_type_text                    ?? '',
    buying_reason:               buyerInfo.buying_reason_text                 ?? '',
    buying_experience:           buyerInfo.buying_experience_text             ?? '',
    decision_speed:              buyerInfo.decision_speed_text                ?? '',
    industry_preferences:        buyerInfo.industry_preferences_list_option_sectors ?? [],
    excluded_sectors:            buyerInfo.excluded_sectors_list_option_sectors     ?? [],
    geography:                   buyerInfo.geography_text                     ?? '',
    turnover_range:              buyerInfo.turnover_range_text                ?? '',
    ebitda_range:                buyerInfo.ebitda_range_text                  ?? '',
    ebitda_margin_min:           buyerInfo.ebitda_margin_min_text             ?? '',
    asset_base:                  buyerInfo.asset_base_text                    ?? '',
    valuation_range:             buyerInfo.valuation_range_text               ?? '',
    deal_structure_preferences:  buyerInfo.deal_structure_preferences_text   ?? '',
    funding_source:              buyerInfo.funding_source_text                ?? '',
    business_age:                buyerInfo.business_age_text                  ?? '',
    employee_headcount:          buyerInfo.employee_headcount_text            ?? '',
    customer_base_type:          buyerInfo.customer_base_type_text            ?? '',
    contractual_recurrence:      buyerInfo.contractual_recurrence_text        ?? '',
    ip_technology:               buyerInfo.ip_technology_text                 ?? '',
    physical_digital:            buyerInfo.physical_digital_text              ?? '',
    involvement:                 buyerInfo.involvement_text                   ?? '',
    problems:                    buyerInfo.problems_text                      ?? '',
  };

  // 4. Extract with OpenAI
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const aiRes = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: BUYER_INFO_EXTRACTION_PROMPT },
      {
        role: 'user',
        content: `Current profile:\n${JSON.stringify(currentProfile, null, 2)}\n\nTranscript:\n${transcriptText}`,
      },
    ],
  });

  const extracted = JSON.parse(aiRes.choices[0].message.content ?? '{}') as Record<string, unknown>;

  // 5. Map extracted fields → Bubble field names, only writing fields that changed
  const update: Record<string, unknown> = {};

  const setText = (from: keyof typeof currentProfile, to: string) => {
    const v = extracted[from];
    if (typeof v !== 'string' || !v.trim()) return; // empty — skip
    if (v.trim() === (currentProfile[from] as string)) return; // unchanged — skip
    update[to] = v.trim();
  };

  setText('buyer_type',                 'buyer_type_text');
  setText('buying_reason',              'buying_reason_text');
  setText('buying_experience',          'buying_experience_text');
  setText('decision_speed',             'decision_speed_text');
  setText('geography',                  'geography_text');
  setText('turnover_range',             'turnover_range_text');
  setText('ebitda_range',               'ebitda_range_text');
  setText('ebitda_margin_min',          'ebitda_margin_min_text');
  setText('asset_base',                 'asset_base_text');
  setText('valuation_range',            'valuation_range_text');
  setText('deal_structure_preferences', 'deal_structure_preferences_text');
  setText('funding_source',             'funding_source_text');
  setText('business_age',               'business_age_text');
  setText('employee_headcount',         'employee_headcount_text');
  setText('customer_base_type',         'customer_base_type_text');
  setText('contractual_recurrence',     'contractual_recurrence_text');
  setText('ip_technology',              'ip_technology_text');
  setText('physical_digital',           'physical_digital_text');
  setText('involvement',                'involvement_text');
  setText('problems',                   'problems_text');

  const prefs = extracted.industry_preferences;
  if (Array.isArray(prefs) && prefs.length > 0) {
    const existing = currentProfile.industry_preferences as string[];
    const changed = prefs.length !== existing.length || prefs.some((v, i) => v !== existing[i]);
    if (changed) update.industry_preferences_list_option_sectors = prefs;
  }
  const excl = extracted.excluded_sectors;
  if (Array.isArray(excl) && excl.length > 0) {
    const existing = currentProfile.excluded_sectors as string[];
    const changed = excl.length !== existing.length || excl.some((v, i) => v !== existing[i]);
    if (changed) update.excluded_sectors_list_option_sectors = excl;
  }

  if (Object.keys(update).length > 0) {
    await bubblePatch(`/obj/Buyer_Info/${buyerInfo._id as string}`, update);
  }

  console.log(`[bubble] buyer-info extract: updated ${Object.keys(update).length} fields for user ${userId}`);
  res.json({ ok: true, fields_updated: Object.keys(update).length, fields: Object.keys(update) });
}));

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
    { key: 'dismissed_boolean', constraint_type: 'not equal', value: true },
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

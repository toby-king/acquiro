/**
 * Service for creating agents via the Bubble API
 */

import { AdvisorConfig } from '../types/advisor';

const API_URL = `${import.meta.env.VITE_BUBBLE_API_BASE_URL}/create_agent`;
const API_TOKEN = import.meta.env.VITE_BUBBLE_API_TOKEN;
// Derive the Bubble data API base from the workflow URL (/wf → /obj)
const BUBBLE_DATA_BASE = (import.meta.env.VITE_BUBBLE_API_BASE_URL as string)
  ?.replace(/\/wf(\/.*)?$/, '/obj') ?? '';

if (!API_TOKEN || !import.meta.env.VITE_BUBBLE_API_BASE_URL) {
  console.error('Missing required environment variables: VITE_BUBBLE_API_TOKEN and/or VITE_BUBBLE_API_BASE_URL');
}

interface CreateAgentPayload {
  lead_id: string;
  name: string;
  email: string;
  challenge_style: string;
  profanity: string;
  traits: string;
  type: string;
  voice: string;
  personality?: string;
}

interface CreateAgentResponse {
  [key: string]: unknown;
}

/**
 * Sanitises an agent name into a valid email local-part.
 * "Sophia O'Brien" → "sophiaobrien"
 */
function sanitiseAgentName(name: string): string {
  return (name || 'agent')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-zA-Z0-9]/g, '')    // remove spaces + special chars
    .toLowerCase() || 'agent';
}

/**
 * Checks whether an email address is already in use by an existing agent in Bubble.
 */
async function agentEmailTaken(email: string): Promise<boolean> {
  const constraints = JSON.stringify([
    { key: 'email_text', constraint_type: 'equals', value: email },
  ]);
  const url = `${BUBBLE_DATA_BASE}/Agents?constraints=${encodeURIComponent(constraints)}&limit=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Bubble agent lookup failed: ${res.status}`);
  const data = await res.json() as { response?: { count?: number } };
  return (data.response?.count ?? 0) > 0;
}

/**
 * Returns a unique @acquiro-agent.com address for the given agent name.
 * Tries {name}@acquiro-agent.com first, then {name}.a@ … {name}.z@
 * (the letter suffix reads as a last initial and still looks human).
 */
async function generateAgentEmail(agentName: string): Promise<string> {
  const base = sanitiseAgentName(agentName);
  const domain = 'acquiro-agent.com';

  const candidates = [
    `${base}@${domain}`,
    ...'abcdefghijklmnopqrstuvwxyz'.split('').map((l) => `${base}.${l}@${domain}`),
  ];

  for (const candidate of candidates) {
    if (!(await agentEmailTaken(candidate))) return candidate;
  }

  // Extremely unlikely fallback — all 27 variants taken
  return candidates[candidates.length - 1];
}

/**
 * Formats custom stats into a concatenated string with titles
 */
function formatCustomStats(customStats: AdvisorConfig['customStats']): string {
  if (!customStats) return '';
  return [
    `patience: ${customStats.patience}`,
    `analytical: ${customStats.analytical}`,
    `warmth: ${customStats.warmth}`,
    `directness: ${customStats.directness}`,
    `verbosity: ${customStats.verbosity}`,
  ].join(', ');
}

/**
 * Creates an agent by sending configuration data to the Bubble API.
 * Generates and assigns a unique @acquiro-agent.com email before creation.
 */
export async function createAgent(
  leadId: string,
  config: AdvisorConfig
): Promise<CreateAgentResponse | null> {
  try {
    const agentName = config.advisorName || 'agent';
    const email = await generateAgentEmail(agentName);

    const payload: CreateAgentPayload = {
      lead_id: leadId,
      name: agentName,
      email,
      challenge_style: config.challengeStyle || '',
      profanity: config.allowProfanity.toString(),
      traits: config.traits.embrace.join(', '),
      type: config.type || '',
      voice: config.voice?.id || '',
    };

    if (config.personality) {
      payload.personality = config.personality.name;
    } else if (config.customStats) {
      payload.personality = formatCustomStats(config.customStats);
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json() as CreateAgentResponse;
    console.log('Agent created successfully:', payload);
    return data;
  } catch (error) {
    console.error('Failed to create agent:', error);
    return null;
  }
}

/**
 * Service for creating agents via the backend API.
 */

import { AdvisorConfig } from '../types/advisor';

import { API_URL } from '../utils/apiUrl';

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

function sanitiseAgentName(name: string): string {
  return (name || 'agent')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase() || 'agent';
}

async function agentEmailTaken(email: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/api/bubble/agent/email-check?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error(`Agent email check failed: ${res.status}`);
  const data = await res.json() as { taken?: boolean };
  return data.taken === true;
}

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

  return candidates[candidates.length - 1];
}

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

export async function createAgent(
  leadId: string,
  config: AdvisorConfig,
): Promise<Record<string, unknown> | null> {
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

    const response = await fetch(`${API_URL}/api/bubble/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`create_agent failed with status ${response.status}`);

    const data = await response.json() as Record<string, unknown>;
    console.log('[agentService] Agent created:', payload.name, email);
    return data;
  } catch (error) {
    console.error('[agentService] Failed to create agent:', error);
    return null;
  }
}

/**
 * Service for fetching agent details via the backend API.
 */

import { AdvisorConfig } from '../types/advisor';
import { PERSONALITY_PRESETS } from '../constants/personalities';
import { CHALLENGE_STYLES } from '../constants/challengeStyles';
import { VOICE_OPTIONS } from '../constants/voices';

import { API_URL } from '../utils/apiUrl';

export interface GetAgentResponse {
  lead_id?: string;
  name?: string;
  challenge_style?: string;
  profanity?: string;
  traits?: string;
  type?: string;
  voice?: string;
  personality?: string;
  user_name?: string;
  user_email?: string;
}

export interface GetAgentResult {
  config: AdvisorConfig;
  userName: string | null;
  userEmail: string | null;
}

export async function getAgent(leadId: string): Promise<GetAgentResult | null> {
  try {
    const response = await fetch(`${API_URL}/api/bubble/agent?lead_id=${encodeURIComponent(leadId)}`);

    if (!response.ok) throw new Error(`get_agent failed with status ${response.status}`);

    const data = (await response.json()) as { response?: GetAgentResponse; status?: string } | GetAgentResponse;
    const agent = (typeof data === 'object' && data && 'response' in data ? data.response : data) as GetAgentResponse;

    const personality = agent.personality
      ? PERSONALITY_PRESETS.find((p) => p.id === agent.personality) ?? null
      : null;

    const challengeStyle = agent.challenge_style
      ? (CHALLENGE_STYLES.find((s) => s.id === agent.challenge_style)?.id as AdvisorConfig['challengeStyle']) ?? null
      : null;

    const voice = agent.voice
      ? VOICE_OPTIONS.find((v) => v.id === agent.voice) ?? null
      : null;

    const traitsStr = agent.traits ?? '';
    const embrace = traitsStr ? traitsStr.split(',').map((t) => t.trim()).filter(Boolean) : [];

    const config: AdvisorConfig = {
      type: (agent.type as AdvisorConfig['type']) ?? null,
      personality,
      customStats: null,
      traits: { embrace, avoid: [] },
      challengeStyle,
      challengeLevel: challengeStyle ? 50 : 50,
      voice,
      allowProfanity: agent.profanity === 'true',
      advisorName: agent.name ?? null,
    };

    return {
      config,
      userName: agent.user_name ?? null,
      userEmail: agent.user_email ?? null,
    };
  } catch (error) {
    console.error('[getAgentService] Failed to get agent:', error);
    return null;
  }
}

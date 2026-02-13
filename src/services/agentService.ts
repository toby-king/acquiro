/**
 * Service for creating agents via the Bubble API
 */

import { AdvisorConfig } from '../types/advisor';

const API_URL = `${import.meta.env.VITE_BUBBLE_API_BASE_URL}/create_agent`;
const API_TOKEN = import.meta.env.VITE_BUBBLE_API_TOKEN;

if (!API_TOKEN || !import.meta.env.VITE_BUBBLE_API_BASE_URL) {
  console.error('Missing required environment variables: VITE_BUBBLE_API_TOKEN and/or VITE_BUBBLE_API_BASE_URL');
}

interface CreateAgentPayload {
  lead_id: string;
  name: string;
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
 * Formats custom stats into a concatenated string with titles
 */
function formatCustomStats(customStats: AdvisorConfig['customStats']): string {
  if (!customStats) return '';
  
  const statsArray = [
    `patience: ${customStats.patience}`,
    `analytical: ${customStats.analytical}`,
    `warmth: ${customStats.warmth}`,
    `directness: ${customStats.directness}`,
    `verbosity: ${customStats.verbosity}`,
  ];
  
  return statsArray.join(', ');
}

/**
 * Creates an agent by sending configuration data to the Bubble API
 * @param leadId - The lead ID from the created lead
 * @param config - The advisor configuration containing all agent settings
 * @returns Promise that resolves to the API response
 */
export async function createAgent(
  leadId: string,
  config: AdvisorConfig
): Promise<CreateAgentResponse | null> {
  try {
    // Build the payload with all values as strings
    const payload: CreateAgentPayload = {
      lead_id: leadId,
      name: config.advisorName || '',
      challenge_style: config.challengeStyle || '',
      profanity: config.allowProfanity.toString(),
      traits: config.traits.embrace.join(', '), // Concatenate embraced traits
      type: config.type || '',
      voice: config.voice?.id || '',
    };

    // Add personality field based on whether preset or custom
    if (config.personality) {
      // Use personality preset ID
      payload.personality = config.personality.id;
    } else if (config.customStats) {
      // Concatenate custom stats with their titles
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
    
    // Optionally log success (in production, you might want to remove console logs)
    console.log('Agent created successfully:', payload);
    
    return data;
  } catch (error) {
    // Log error but don't throw - we don't want to interrupt the user flow
    console.error('Failed to create agent:', error);
    // In a production app, you might want to send this to an error tracking service
    return null;
  }
}

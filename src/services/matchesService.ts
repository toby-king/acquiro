/**
 * Service for fetching matches via the Bubble API
 */

interface DisplayMatchesPayload {
  user_id: string;
}

const API_URL = `${import.meta.env.VITE_BUBBLE_API_BASE_URL}/display_matches`;
const API_TOKEN = import.meta.env.VITE_BUBBLE_API_TOKEN;

if (!API_TOKEN || !import.meta.env.VITE_BUBBLE_API_BASE_URL) {
  console.error('Missing required environment variables: VITE_BUBBLE_API_TOKEN and/or VITE_BUBBLE_API_BASE_URL');
}

/** API returns objects with business_name and description */
interface BubbleMatchItem {
  business_name?: string;
  description?: string;
}

export interface Match {
  id: string;
  companyName: string;
  description: string;
  status: 'new' | 'pending' | null;
  thumbnail: string | null;
}

/**
 * Fetches matches for a user by sending user_id to the Bubble API.
 * API returns [{ business_name, description }, ...]
 * @param userId - The user ID to fetch matches for
 * @returns Promise that resolves to an array of matches
 */
export async function fetchMatches(userId: string): Promise<Match[]> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // API returns { status, response: { matches: "<json string>" } }
    // matches is a JSON string of array of { business_name, description }
    let raw: BubbleMatchItem[] = [];
    const matchesData = data?.response?.matches;

    if (typeof matchesData === 'string') {
      try {
        let parsed = JSON.parse(matchesData);
        if (!Array.isArray(parsed)) {
          // Fallback: Bubble may return comma-separated objects without array brackets
          const wrapped = `[${matchesData.trim()}]`;
          parsed = JSON.parse(wrapped);
        }
        raw = Array.isArray(parsed) ? parsed : [];
      } catch {
        console.warn('Failed to parse matches JSON string:', matchesData?.slice(0, 100));
      }
    } else if (Array.isArray(matchesData)) {
      raw = matchesData;
    } else if (Array.isArray(data)) {
      raw = data;
    } else if (data?.response && Array.isArray(data.response)) {
      raw = data.response;
    }

    const mappedMatches: Match[] = raw.map((item, index) => ({
      id: `match-${index}`,
      companyName: item.business_name ?? 'Unknown Business',
      description: item.description ?? '',
      status: null,
      thumbnail: null,
    }));

    return mappedMatches;
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    throw error;
  }
}

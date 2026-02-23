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

    // API returns array of { business_name, description } (possibly wrapped in response)
    let raw: BubbleMatchItem[] = [];
    if (Array.isArray(data)) {
      raw = data;
    } else if (data?.response && Array.isArray(data.response)) {
      raw = data.response;
    } else if (data?.matches && Array.isArray(data.matches)) {
      raw = data.matches;
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

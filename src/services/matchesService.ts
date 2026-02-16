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

export interface Match {
  id: string;
  companyName: string;
  description: string;
  status: 'new' | 'pending' | null;
  thumbnail: string | null;
  // Add other fields as needed based on API response
  [key: string]: any;
}

interface DisplayMatchesResponse {
  status: string;
  response: {
    matches?: Match[];
    // Handle different possible response structures
    [key: string]: any;
  };
}

/**
 * Fetches matches for a user by sending user_id to the Bubble API
 * @param userId - The user ID to fetch matches for
 * @returns Promise that resolves to an array of matches
 */
export async function fetchMatches(userId: string): Promise<Match[]> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const payload: DisplayMatchesPayload = {
      user_id: userId,
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json() as DisplayMatchesResponse;
    
    console.log('Matches fetched successfully for user:', userId);
    
    // Handle different possible response structures
    let matches: Match[] = [];
    
    if (data.response?.matches && Array.isArray(data.response.matches)) {
      matches = data.response.matches;
    } else if (Array.isArray(data.response)) {
      matches = data.response;
    } else if (Array.isArray(data)) {
      matches = data;
    }
    
    // Map API response to Match interface
    const mappedMatches: Match[] = matches.map((match: any) => ({
      id: match.id || match.match_id || String(match),
      companyName: match.companyName || match.company_name || match.name || 'Unknown Company',
      description: match.description || match.summary || match.details || '',
      status: match.status === 'new' || match.status === 'New' ? 'new' : 
              match.status === 'pending' || match.status === 'Pending' ? 'pending' : null,
      thumbnail: match.thumbnail || match.image || match.logo || null,
      ...match, // Preserve any additional fields
    }));
    
    console.log('Mapped matches:', mappedMatches);
    return mappedMatches;
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    throw error;
  }
}

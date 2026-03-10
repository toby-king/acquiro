/**
 * Service for fetching and dismissing matches via the backend API.
 * The backend joins match records with business details and returns clean JSON.
 */

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('Missing required environment variable: VITE_API_URL');
}

export interface Match {
  id: string;
  matchId: string | null;
  companyName: string;
  description: string;
  status: 'new' | 'pending' | null;
  thumbnail: string | null;
}

export async function fetchMatches(userId: string): Promise<Match[]> {
  if (!userId) throw new Error('User ID is required');

  const response = await fetch(`${API_URL}/api/bubble/matches/${userId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`fetchMatches failed: ${response.status}: ${errorText}`);
  }

  const data = await response.json() as { matches?: Match[] };
  return data.matches ?? [];
}

export async function dismissMatch(matchId: string): Promise<void> {
  if (!matchId) throw new Error('Match ID is required to dismiss');

  const response = await fetch(`${API_URL}/api/bubble/matches/${matchId}/dismiss`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`dismissMatch failed: ${response.status} ${errorText}`);
  }
}

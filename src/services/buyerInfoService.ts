/**
 * Service for fetching buyer/criteria info via the backend API.
 */

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('Missing required environment variable: VITE_API_URL');
}

export interface BuyerInfo {
  [key: string]: unknown;
}

export async function getBuyerInfo(userId: string): Promise<BuyerInfo | null> {
  try {
    if (!userId) return null;

    const response = await fetch(`${API_URL}/api/bubble/buyer-info/${userId}`);

    if (!response.ok) {
      console.warn('[buyerInfoService] get_buyerinfo failed:', response.status);
      return null;
    }

    const data = await response.json();
    const info = data.response ?? data;
    return typeof info === 'object' && info !== null ? info : null;
  } catch (error) {
    console.error('[buyerInfoService] Failed to fetch buyer info:', error);
    return null;
  }
}

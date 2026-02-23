/**
 * Service for fetching buyer/criteria info via the Bubble API
 */

const API_URL = `${import.meta.env.VITE_BUBBLE_API_BASE_URL}/get_buyerinfo`;
const API_TOKEN = import.meta.env.VITE_BUBBLE_API_TOKEN;

if (!API_TOKEN || !import.meta.env.VITE_BUBBLE_API_BASE_URL) {
  console.error('Missing required environment variables: VITE_BUBBLE_API_TOKEN and/or VITE_BUBBLE_API_BASE_URL');
}

export interface BuyerInfo {
  [key: string]: unknown;
}

interface GetBuyerInfoPayload {
  user_id: string;
}

/**
 * Fetches buyer criteria/info for a user from the Bubble API
 * @param userId - The user ID to fetch buyer info for
 * @returns Promise that resolves to the buyer info object, or null on failure
 */
export async function getBuyerInfo(userId: string): Promise<BuyerInfo | null> {
  try {
    if (!userId) {
      return null;
    }

    const payload: GetBuyerInfoPayload = {
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
      console.warn('[buyerInfoService] get_buyerinfo failed:', response.status, errorText);
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

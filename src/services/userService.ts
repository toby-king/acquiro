/**
 * Service for creating users via the Bubble API
 */

interface CreateUserPayload {
  lead_id: string;
}

const API_URL = `${import.meta.env.VITE_BUBBLE_API_BASE_URL}/create_user`;
const API_TOKEN = import.meta.env.VITE_BUBBLE_API_TOKEN;

if (!API_TOKEN || !import.meta.env.VITE_BUBBLE_API_BASE_URL) {
  console.error('Missing required environment variables: VITE_BUBBLE_API_TOKEN and/or VITE_BUBBLE_API_BASE_URL');
}

interface CreateUserResponse {
  status: string;
  response: {
    user_id: string;
  };
}

interface CreateUserResult {
  user_id: string;
}

/**
 * Creates a user by sending lead_id to the Bubble API
 * @param leadId - The lead ID to convert to a user
 * @returns Promise that resolves to the API response containing user_id
 */
export async function createUser(leadId: string): Promise<CreateUserResult | null> {
  try {
    if (!leadId) {
      throw new Error('Lead ID is required to create user account');
    }

    if (!API_TOKEN || !import.meta.env.VITE_BUBBLE_API_BASE_URL) {
      throw new Error('Bubble API configuration is missing. Cannot create user account.');
    }

    const payload: CreateUserPayload = {
      lead_id: leadId,
    };

    console.log('[userService] Creating user account in Bubble API for lead:', leadId);
    console.log('[userService] API URL:', API_URL);

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
      const errorMessage = `Bubble API request failed with status ${response.status}: ${errorText}`;
      console.error('[userService]', errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json() as CreateUserResponse;
    
    if (!data.response?.user_id) {
      const errorMessage = 'Bubble API response missing user_id';
      console.error('[userService]', errorMessage, 'Response:', data);
      throw new Error(errorMessage);
    }
    
    console.log('[userService] User account created successfully for lead:', leadId);
    console.log('[userService] User ID:', data.response.user_id);
    
    const result: CreateUserResult = {
      user_id: data.response.user_id,
    };
    return result;
  } catch (error) {
    console.error('[userService] Failed to create user account:', error);
    if (error instanceof Error) {
      console.error('[userService] Error details:', error.message);
    }
    // Re-throw the error so the caller can handle it appropriately
    throw error;
  }
}

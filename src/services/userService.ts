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
      throw new Error('Lead ID is required');
    }

    const payload: CreateUserPayload = {
      lead_id: leadId,
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

    const data = await response.json() as CreateUserResponse;
    
    console.log('User created successfully for lead:', leadId);
    console.log('User ID:', data.response?.user_id);
    
    const result: CreateUserResult = {
      user_id: data.response.user_id,
    };
    return result;
  } catch (error) {
    console.error('Failed to create user:', error);
    return null;
  }
}

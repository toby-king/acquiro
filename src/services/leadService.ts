/**
 * Service for creating leads via the Bubble API
 */

interface CreateLeadPayload {
  name: string;
  email: string;
}

const API_URL = 'https://toby-85612.bubbleapps.io/version-test/api/1.1/wf/create_lead';
const API_TOKEN = '65e1b0545a3747cebcfda16ac6e294f8';

interface CreateLeadResponse {
  status: string;
  response: {
    lead_id: string;
  };
}

interface CreateLeadResult {
  lead_id: string;
}

/**
 * Creates a lead by sending name and email to the Bubble API
 * @param payload - Object containing name and email
 * @returns Promise that resolves to the API response containing lead_id
 */
export async function createLead(payload: CreateLeadPayload): Promise<CreateLeadResult | null> {
  try {
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

    const data = await response.json() as CreateLeadResponse;
    
    // Optionally log success (in production, you might want to remove console logs)
    console.log('Lead created successfully:', payload);
    console.log('Lead ID:', data.response?.lead_id);
    
    // Return the response object with lead_id for easier access
    const result: CreateLeadResult = {
      lead_id: data.response.lead_id,
    };
    return result;
  } catch (error) {
    // Log error but don't throw - we don't want to interrupt the user flow
    console.error('Failed to create lead:', error);
    // In a production app, you might want to send this to an error tracking service
    return null;
  }
}

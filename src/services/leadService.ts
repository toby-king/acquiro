/**
 * Service for creating leads via the Bubble API
 */

interface CreateLeadPayload {
  name: string;
  email: string;
}

const API_URL = 'https://toby-85612.bubbleapps.io/version-test/api/1.1/wf/create_lead';
const API_TOKEN = '65e1b0545a3747cebcfda16ac6e294f8';

/**
 * Creates a lead by sending name and email to the Bubble API
 * @param payload - Object containing name and email
 * @returns Promise that resolves to the API response
 */
export async function createLead(payload: CreateLeadPayload): Promise<void> {
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

    // Optionally log success (in production, you might want to remove console logs)
    console.log('Lead created successfully:', payload);
  } catch (error) {
    // Log error but don't throw - we don't want to interrupt the user flow
    console.error('Failed to create lead:', error);
    // In a production app, you might want to send this to an error tracking service
  }
}

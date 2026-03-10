/**
 * Service for creating leads via the backend API.
 */

import { API_URL } from '../utils/apiUrl';

interface CreateLeadPayload {
  name: string;
  email: string;
}

interface CreateLeadResult {
  lead_id: string;
}

export async function createLead(payload: CreateLeadPayload): Promise<CreateLeadResult | null> {
  try {
    const response = await fetch(`${API_URL}/api/bubble/lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`create_lead failed with status ${response.status}`);

    const data = await response.json() as { response?: { lead_id?: string } };
    const leadId = data.response?.lead_id;
    if (!leadId) throw new Error('Response missing lead_id');

    console.log('[leadService] Lead created:', payload.email, 'lead_id:', leadId);
    return { lead_id: leadId };
  } catch (error) {
    console.error('[leadService] Failed to create lead:', error);
    return null;
  }
}

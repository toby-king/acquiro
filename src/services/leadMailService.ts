/**
 * Service for sending lead retention emails via the Bubble API
 */

const API_URL = `${import.meta.env.VITE_BUBBLE_API_BASE_URL}/send_lead_mail`;
const API_TOKEN = import.meta.env.VITE_BUBBLE_API_TOKEN;

if (!API_TOKEN || !import.meta.env.VITE_BUBBLE_API_BASE_URL) {
  console.error('Missing required environment variables: VITE_BUBBLE_API_TOKEN and/or VITE_BUBBLE_API_BASE_URL');
}

/**
 * Sends a retention email to the lead with a link to return to the builder
 * @param leadId - The lead ID to send the email for
 * @returns Promise that resolves when the request completes
 */
export async function sendLeadMail(leadId: string): Promise<void> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({ lead_id: leadId }),
    });

    if (!response.ok) {
      throw new Error(`send_lead_mail failed with status ${response.status}`);
    }
    console.log('[leadMailService] Retention email sent for lead:', leadId);
  } catch (error) {
    console.error('[leadMailService] Failed to send lead mail:', error);
  }
}

const SENT_KEY_PREFIX = 'acquiro_lead_mail_sent_';

/**
 * Check if we've already sent the retention email for this lead this session
 */
export function hasSentLeadMail(leadId: string): boolean {
  try {
    return sessionStorage.getItem(`${SENT_KEY_PREFIX}${leadId}`) === '1';
  } catch {
    return false;
  }
}

/**
 * Mark that we've sent the retention email for this lead
 */
export function markLeadMailSent(leadId: string): void {
  try {
    sessionStorage.setItem(`${SENT_KEY_PREFIX}${leadId}`, '1');
  } catch {
    // ignore
  }
}

/**
 * Service for sending lead retention emails via the backend API.
 */

import { API_URL } from '../utils/apiUrl';

export async function sendLeadMail(leadId: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/bubble/lead/mail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId }),
    });

    if (!response.ok) throw new Error(`send_lead_mail failed with status ${response.status}`);
    console.log('[leadMailService] Retention email sent for lead:', leadId);
  } catch (error) {
    console.error('[leadMailService] Failed to send lead mail:', error);
  }
}

const SENT_KEY_PREFIX = 'acquiro_lead_mail_sent_';

export function hasSentLeadMail(leadId: string): boolean {
  try {
    return sessionStorage.getItem(`${SENT_KEY_PREFIX}${leadId}`) === '1';
  } catch {
    return false;
  }
}

export function markLeadMailSent(leadId: string): void {
  try {
    sessionStorage.setItem(`${SENT_KEY_PREFIX}${leadId}`, '1');
  } catch {
    // ignore
  }
}

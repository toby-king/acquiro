/**
 * Service for sending lead retention emails via the backend API.
 */

import { API_URL } from '../utils/apiUrl';

export function sendLeadMail(leadId: string): void {
  try {
    const url = `${API_URL}/api/bubble/lead/mail`;
    const blob = new Blob([JSON.stringify({ lead_id: leadId })], { type: 'application/json' });
    const queued = navigator.sendBeacon(url, blob);
    if (!queued) {
      // sendBeacon can return false if the queue is full — fall back to fetch
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId }),
        keepalive: true,
      }).catch(() => {});
    }
    console.log('[leadMailService] Retention email queued for lead:', leadId);
  } catch (error) {
    console.error('[leadMailService] Failed to queue lead mail:', error);
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

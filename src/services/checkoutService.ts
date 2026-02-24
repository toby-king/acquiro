const PRODUCTION_BACKEND = 'https://acquiro-backend.vercel.app';

function getApiUrl(): string {
  // When served from a real domain (not localhost), always use production backend.
  // This avoids "Failed to fetch" when VITE_API_URL was set to localhost in build.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return PRODUCTION_BACKEND;
    }
  }
  return (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? PRODUCTION_BACKEND : 'http://localhost:3001')
  );
}

const API_URL = getApiUrl();

export interface CreateCheckoutSessionParams {
  billingPeriod: 'monthly' | 'annual';
  userId?: string;
  userEmail?: string;
}

export interface CheckoutSessionResponse {
  clientSecret: string;
}

export interface SessionStatusResponse {
  status: string;
  customerEmail?: string;
  /** Lead ID stored in checkout session metadata (survives redirect from Stripe) */
  leadId?: string;
  /** Stripe subscription ID created by this checkout session */
  subscriptionId?: string;
}

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResponse> {
  const response = await fetch(`${API_URL}/api/checkout/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create checkout session' }));
    throw new Error(error.error || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Get checkout session status
 */
export async function getSessionStatus(sessionId: string): Promise<SessionStatusResponse> {
  const response = await fetch(`${API_URL}/api/checkout/session-status?session_id=${sessionId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get session status' }));
    throw new Error(error.error || 'Failed to get session status');
  }

  return response.json();
}

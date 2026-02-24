/**
 * Service for user operations via the Bubble API (create_user, get_user)
 */

const BASE_URL = import.meta.env.VITE_BUBBLE_API_BASE_URL;
const API_TOKEN = import.meta.env.VITE_BUBBLE_API_TOKEN;
const CREATE_USER_URL = `${BASE_URL}/create_user`;
const UPDATE_USER_URL = `${BASE_URL}/update_user`;
const GET_USER_URL = `${BASE_URL}/get_user`;
const SEND_MAGIC_LINK_URL = `${BASE_URL}/send_magic_link`;

interface CreateUserPayload {
  lead_id: string;
  subscription_id?: string;
}

if (!API_TOKEN || !BASE_URL) {
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
export async function createUser(leadId: string, subscriptionId?: string): Promise<CreateUserResult | null> {
  try {
    if (!leadId) {
      throw new Error('Lead ID is required to create user account');
    }

    if (!API_TOKEN || !BASE_URL) {
      throw new Error('Bubble API configuration is missing. Cannot create user account.');
    }

    const payload: CreateUserPayload = {
      lead_id: leadId,
      ...(subscriptionId && { subscription_id: subscriptionId }),
    };

    const body = JSON.stringify(payload);
    console.log('[userService] Creating user account in Bubble API for lead:', leadId, 'subscriptionId:', subscriptionId);
    console.log('[userService] Request:', {
      url: CREATE_USER_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_TOKEN ? `Bearer ${API_TOKEN.slice(0, 8)}...` : '(missing)',
      },
      body,
    });

    const response = await fetch(CREATE_USER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body,
    });

    const responseText = await response.text();
    console.log('[userService] Response:', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      body: responseText,
    });

    if (!response.ok) {
      const errorMessage = `Bubble API request failed with status ${response.status}: ${responseText}`;
      console.error('[userService]', errorMessage);
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText) as CreateUserResponse;
    
    if (!data.response?.user_id) {
      const errorMessage = 'Bubble API response missing user_id';
      console.error('[userService]', errorMessage, 'Response:', data);
      throw new Error(errorMessage);
    }
    
    const returnedUserId = data.response.user_id;
    console.log('[userService] User account created successfully for lead:', leadId);
    console.log('[userService] ** Returned user_id (stored for dashboard):', returnedUserId);
    
    const result: CreateUserResult = {
      user_id: returnedUserId,
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

// --- update_user (re-subscription) ---

interface UpdateUserPayload {
  user_id: string;
  subscription_id: string;
}

/**
 * Updates an existing user's subscription in Bubble (re-subscription flow).
 * Calls PUT /update_user with { user_id, subscription_id }. Bubble sets is_subscribed to "yes" and stores subscription_id.
 * @param userId - The Bubble user ID
 * @param subscriptionId - The Stripe subscription ID
 */
export async function updateUser(userId: string, subscriptionId: string): Promise<void> {
  if (!userId || !subscriptionId) {
    throw new Error('User ID and subscription ID are required to update user');
  }
  if (!API_TOKEN || !BASE_URL) {
    throw new Error('Bubble API configuration is missing.');
  }

  const payload: UpdateUserPayload = { user_id: userId, subscription_id: subscriptionId };
  const body = JSON.stringify(payload);

  const response = await fetch(UPDATE_USER_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
    },
    body,
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Bubble update_user failed: ${response.status} ${responseText}`);
  }
}

// --- get_user ---

interface GetUserPayload {
  user_id: string;
}

interface GetUserResponse {
  status?: string;
  response?: {
    name?: string;
    email?: string;
    is_subscribed?: string;
    subscription_id?: string | null;
    [key: string]: unknown;
  };
}

export interface GetUserResult {
  name: string | null;
  email: string | null;
  /** true if is_subscribed === 'yes', false otherwise */
  isSubscribed: boolean;
  /** Stripe subscription ID when present */
  subscriptionId: string | null;
}

/**
 * Fetches user profile (name, email) from the Bubble API
 * @param userId - The user ID from create_user / dashboard
 * @returns Promise with name and email (null if not returned)
 */
export async function getUser(userId: string): Promise<GetUserResult> {
  if (!userId) {
    throw new Error('User ID is required to fetch user');
  }
  if (!API_TOKEN || !BASE_URL) {
    throw new Error('Bubble API configuration is missing.');
  }

  const payload: GetUserPayload = { user_id: userId };
  const body = JSON.stringify(payload);

  const response = await fetch(GET_USER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
    },
    body,
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Bubble get_user failed: ${response.status} ${responseText}`);
  }

  const data = JSON.parse(responseText) as GetUserResponse;
  const res = data.response;
  const isSubscribed = (res?.is_subscribed != null && String(res.is_subscribed).toLowerCase() === 'yes');
  const subscriptionId = (res?.subscription_id != null && String(res.subscription_id).trim() !== '')
    ? String(res.subscription_id).trim()
    : null;
  return {
    name: (res?.name != null && String(res.name).trim() !== '') ? String(res.name) : null,
    email: (res?.email != null && String(res.email).trim() !== '') ? String(res.email) : null,
    isSubscribed,
    subscriptionId,
  };
}

// --- get_user by email (login) ---

interface GetUserByEmailPayload {
  email: string;
}

interface GetUserByEmailResponse {
  status?: string;
  response?: {
    email?: string;
    user_id?: string;
    name?: string;
    [key: string]: unknown;
  };
}

export interface GetUserByEmailResult {
  email: string;
  user_id: string;
  name: string | null;
}

/**
 * Looks up a user by email via the Bubble API (for login).
 * @param email - The user's email
 * @returns User email, user_id, and name if the account exists; throws if not found or API error
 */
export async function getUserByEmail(email: string): Promise<GetUserByEmailResult> {
  const trimmed = email?.trim();
  if (!trimmed) {
    throw new Error('Email is required');
  }
  if (!API_TOKEN || !BASE_URL) {
    throw new Error('Bubble API configuration is missing.');
  }

  const payload: GetUserByEmailPayload = { email: trimmed };
  const body = JSON.stringify(payload);

  const response = await fetch(GET_USER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
    },
    body,
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Lookup failed: ${response.status} ${responseText}`);
  }

  const data = JSON.parse(responseText) as GetUserByEmailResponse;
  const res = data.response;
  const userEmail = res?.email != null && String(res.email).trim() !== '' ? String(res.email).trim() : null;
  const userId = res?.user_id != null && String(res.user_id).trim() !== '' ? String(res.user_id).trim() : null;
  const name = res?.name != null && String(res.name).trim() !== '' ? String(res.name).trim() : null;

  if (!userId || !userEmail) {
    throw new Error('ACCOUNT_NOT_FOUND');
  }

  return {
    email: userEmail,
    user_id: userId,
    name: name ?? null,
  };
}

// --- send_magic_link ---

interface SendMagicLinkPayload {
  email: string;
}

/**
 * Sends a magic link to the given email via the Bubble API.
 * @param email - The user's email
 * @throws On API error or when no account exists (Bubble returns error)
 */
export async function sendMagicLink(email: string): Promise<void> {
  const trimmed = email?.trim();
  if (!trimmed) {
    throw new Error('Email is required');
  }
  if (!API_TOKEN || !BASE_URL) {
    throw new Error('Bubble API configuration is missing.');
  }

  const payload: SendMagicLinkPayload = { email: trimmed };
  const body = JSON.stringify(payload);

  const response = await fetch(SEND_MAGIC_LINK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
    },
    body,
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error('SEND_MAGIC_LINK_ERROR');
  }

  const data = responseText ? JSON.parse(responseText) : {};
  if (data.status === 'error' || data.error) {
    throw new Error('SEND_MAGIC_LINK_ERROR');
  }
}

// --- get_user by magic link (verify link) ---

interface GetUserByMagicLinkPayload {
  magic_link: string;
}

interface GetUserByMagicLinkResponse {
  status?: string;
  response?: {
    email?: string;
    user_id?: string;
    name?: string;
    [key: string]: unknown;
  };
}

export interface GetUserByMagicLinkResult {
  email: string;
  user_id: string;
  name: string | null;
}

/**
 * Fetches user details by magic link (for /login?link=...).
 * Calls Bubble get_user with body { magic_link } and returns the user's details.
 * @param link - The magic link value from the email (URL query param ?link=...)
 * @returns User email, user_id, and name
 */
export async function getUserByMagicLink(link: string): Promise<GetUserByMagicLinkResult> {
  const trimmed = link?.trim();
  if (!trimmed) {
    throw new Error('Link is required');
  }
  if (!API_TOKEN || !BASE_URL) {
    throw new Error('Bubble API configuration is missing.');
  }

  const payload: GetUserByMagicLinkPayload = { magic_link: trimmed };
  const body = JSON.stringify(payload);

  const response = await fetch(GET_USER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
    },
    body,
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error('LINK_EXPIRED');
  }

  const data = JSON.parse(responseText) as GetUserByMagicLinkResponse;
  const res = data.response;
  const userEmail = res?.email != null && String(res.email).trim() !== '' ? String(res.email).trim() : null;
  const userId = res?.user_id != null && String(res.user_id).trim() !== '' ? String(res.user_id).trim() : null;
  const name = res?.name != null && String(res.name).trim() !== '' ? String(res.name).trim() : null;

  if (!userId || !userEmail) {
    throw new Error('LINK_EXPIRED');
  }

  return {
    email: userEmail,
    user_id: userId,
    name: name ?? null,
  };
}

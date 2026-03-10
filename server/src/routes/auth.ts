import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';

const router = Router();

const BUBBLE_BASE = 'https://toby-85612.bubbleapps.io/version-test/api/1.1';
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getBubbleKey() {
  const key = process.env.BUBBLE_API_KEY;
  if (!key) throw new Error('BUBBLE_API_KEY is not configured');
  return key;
}

/** Find a Bubble user record by email using the existing get_user workflow */
async function lookupUserByEmail(email: string): Promise<{ user_id: string; email: string; name: string | null } | null> {
  const res = await fetch(`${BUBBLE_BASE}/wf/get_user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getBubbleKey()}`,
    },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) return null;
  const data = await res.json() as { response?: { user_id?: string; email?: string; name?: string } };
  const r = data.response;
  if (!r?.user_id || !r?.email) return null;
  return {
    user_id: r.user_id,
    email: r.email,
    name: r.name ?? null,
  };
}

/** Store a magic link token + expiry on the Bubble user record */
async function storeMagicLinkToken(userId: string, token: string, expiresAt: string): Promise<void> {
  const res = await fetch(`${BUBBLE_BASE}/obj/user/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getBubbleKey()}`,
    },
    body: JSON.stringify({
      magic_link_text: token,
      magic_link_expires_text: expiresAt,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Bubble storeMagicLinkToken returned HTTP ${res.status}: ${text}`);
  }
}

/** Look up a user by magic_link_text token */
async function findUserByToken(token: string): Promise<{ _id: string; email: string; name?: string; magic_link_expires_text?: string } | null> {
  const constraints = JSON.stringify([
    { key: 'magic_link_text', constraint_type: 'equals', value: token },
  ]);
  const res = await fetch(`${BUBBLE_BASE}/obj/user?constraints=${encodeURIComponent(constraints)}&limit=1`, {
    headers: { 'Authorization': `Bearer ${getBubbleKey()}` },
  });
  if (!res.ok) return null;
  const data = await res.json() as { response?: { results?: Array<{ _id: string; email?: string; name?: string; magic_link_expires_text?: string; authentication?: { email?: { email?: string } } }> } };
  const record = data.response?.results?.[0];
  if (!record) return null;
  const email = record.authentication?.email?.email ?? record.email ?? '';
  return { _id: record._id, email, name: record.name, magic_link_expires_text: record.magic_link_expires_text };
}

/** Clear the magic link token from the Bubble user record */
async function clearMagicLinkToken(userId: string): Promise<void> {
  await fetch(`${BUBBLE_BASE}/obj/user/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getBubbleKey()}`,
    },
    body: JSON.stringify({ magic_link_text: '', magic_link_expires_text: '' }),
  });
}

// POST /api/auth/magic-link
// Body: { email: string }
router.post('/magic-link', async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email?.trim()) {
    return res.status(400).json({ error: 'email is required' });
  }

  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (!sendgridKey) {
    console.error('[auth] SENDGRID_API_KEY is not set');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  // 1. Look up user
  let user: { user_id: string; email: string; name: string | null } | null;
  try {
    user = await lookupUserByEmail(email.trim());
  } catch (err) {
    console.error('[auth] lookupUserByEmail failed:', err);
    return res.status(500).json({ error: 'Failed to look up account' });
  }

  if (!user) {
    // Return the same response to avoid email enumeration
    console.log(`[auth] No account found for ${email} — sending generic response`);
    return res.json({ ok: true });
  }

  // 2. Generate token + expiry
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  // 3. Store in Bubble
  try {
    await storeMagicLinkToken(user.user_id, token, expiresAt);
  } catch (err) {
    console.error('[auth] storeMagicLinkToken failed:', err);
    return res.status(500).json({ error: 'Failed to generate login link' });
  }

  // 4. Build magic link URL
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const magicLink = `${frontendUrl}/login?link=${token}`;

  // 5. Send email via SendGrid
  const html = buildMagicLinkEmail(magicLink);

  const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sendgridKey}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: user.email }] }],
      from: { email: 'noreply@acquiro-agent.com', name: 'Acquiro' },
      subject: 'Sign in to Acquiro',
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!sgRes.ok) {
    const errText = await sgRes.text().catch(() => '');
    console.error(`[auth] SendGrid error ${sgRes.status}: ${errText.substring(0, 200)}`);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  console.log(`[auth] Magic link sent to ${user.email}`);
  return res.json({ ok: true });
});

// GET /api/auth/verify?token=...
router.get('/verify', async (req: Request, res: Response) => {
  const token = req.query.token as string | undefined;
  if (!token?.trim()) {
    return res.status(400).json({ error: 'token is required' });
  }

  // 1. Look up user by token
  let record: { _id: string; email: string; name?: string; magic_link_expires_text?: string } | null;
  try {
    record = await findUserByToken(token.trim());
  } catch (err) {
    console.error('[auth] findUserByToken failed:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }

  if (!record) {
    return res.status(401).json({ error: 'LINK_EXPIRED' });
  }

  // 2. Check expiry
  const expiresAt = record.magic_link_expires_text;
  if (!expiresAt || Date.now() > new Date(expiresAt).getTime()) {
    await clearMagicLinkToken(record._id).catch(() => {});
    return res.status(401).json({ error: 'LINK_EXPIRED' });
  }

  // 3. Clear the token (single-use)
  await clearMagicLinkToken(record._id).catch((err) => {
    console.warn('[auth] clearMagicLinkToken failed (non-fatal):', err);
  });

  console.log(`[auth] Magic link verified for user ${record._id}`);
  return res.json({
    user_id: record._id,
    email: record.email,
    name: record.name ?? null,
  });
});

function buildMagicLinkEmail(magicLink: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to Acquiro</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 560px; margin: 0 auto; padding: 48px 24px; }
    .logo { font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 700; color: #c6ff4a; letter-spacing: -0.5px; margin-bottom: 40px; }
    .card { background-color: #141a13; border: 1px solid #2a3328; border-radius: 12px; padding: 40px; }
    h1 { color: #e8f5e0; font-size: 22px; font-weight: 600; margin: 0 0 12px 0; }
    p { color: #8fa882; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; }
    .btn { display: inline-block; background-color: #c6ff4a; color: #0b0f0a; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; letter-spacing: 0.2px; }
    .link-fallback { margin-top: 28px; padding-top: 24px; border-top: 1px solid #2a3328; }
    .link-fallback p { font-size: 13px; color: #5a6e54; margin-bottom: 8px; }
    .link-fallback a { color: #8fa882; font-size: 12px; word-break: break-all; }
    .footer { margin-top: 32px; text-align: center; color: #3d4f38; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Acquiro</div>
    <div class="card">
      <h1>Sign in to Acquiro</h1>
      <p>Click the button below to sign in to your account. This link is valid for 15 minutes and can only be used once.</p>
      <a href="${magicLink}" class="btn">Sign in to Acquiro</a>
      <div class="link-fallback">
        <p>Button not working? Copy and paste this link into your browser:</p>
        <a href="${magicLink}">${magicLink}</a>
      </div>
    </div>
    <div class="footer">
      <p>If you didn&rsquo;t request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`;
}

export default router;

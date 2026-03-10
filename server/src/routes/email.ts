import { Router, Request, Response } from 'express';

const router = Router();

const MAGIC_LINK_HTML = `<!DOCTYPE html>
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
      <p>Click the button below to sign in to your account. This link will expire in 10 minutes and can only be used once.</p>
      <a href="MAGIC_LINK_PLACEHOLDER" class="btn">Sign in to Acquiro</a>
      <div class="link-fallback">
        <p>Button not working? Copy and paste this link into your browser:</p>
        <a href="MAGIC_LINK_PLACEHOLDER">MAGIC_LINK_PLACEHOLDER</a>
      </div>
    </div>
    <div class="footer">
      <p>If you didn&rsquo;t request this email, you can safely ignore it.</p>
      <p>&copy; ${new Date().getFullYear()} Acquiro. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

router.post('/magic-link', async (req: Request, res: Response) => {
  const { email, magicLink } = req.body as { email?: string; magicLink?: string };

  if (!email || !magicLink) {
    return res.status(400).json({ error: 'email and magicLink are required' });
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('[email] SENDGRID_API_KEY is not set');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const html = MAGIC_LINK_HTML.replace(/MAGIC_LINK_PLACEHOLDER/g, magicLink);

  try {
    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: 'noreply@acquiro-agent.com', name: 'Acquiro' },
        subject: 'Sign in to Acquiro',
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!sgRes.ok) {
      const errText = await sgRes.text().catch(() => '');
      console.error(`[email] SendGrid error ${sgRes.status}: ${errText.substring(0, 200)}`);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    console.log(`[email] Magic link sent to ${email}`);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[email] Unexpected error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

export default router;

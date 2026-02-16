import { Router, Request, Response } from 'express';
import Stripe from 'stripe';

const router = Router();

// Get Stripe instance dynamically to ensure env vars are loaded
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16',
  });
};

// Price IDs for Professional plan - get them dynamically from env vars
const getPriceIds = () => ({
  monthly: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
  annual: process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID,
});

// Create embedded checkout session
router.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const { billingPeriod, userId, userEmail } = req.body;
    
    // Validate billing period
    if (!billingPeriod || (billingPeriod !== 'monthly' && billingPeriod !== 'annual')) {
      return res.status(400).json({ error: 'Invalid billing period. Must be "monthly" or "annual"' });
    }
    
    const PRICE_IDS = getPriceIds();
    const priceId = PRICE_IDS[billingPeriod as 'monthly' | 'annual'];
    
    if (!priceId) {
      console.error(`Price ID missing for ${billingPeriod}. Available:`, PRICE_IDS);
      console.error('Environment check:', {
        monthly: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
        annual: process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID,
      });
      return res.status(500).json({ 
        error: `Price ID not configured for ${billingPeriod} billing period`,
        details: `Please set STRIPE_PROFESSIONAL_${billingPeriod.toUpperCase()}_PRICE_ID in your .env file`
      });
    }
    
    console.log(`Creating checkout session for ${billingPeriod} with price ID: ${priceId}`);
    
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail || undefined,
      metadata: {
        userId: userId || '',
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          userId: userId || '',
        },
      },
      return_url: `${process.env.FRONTEND_URL}/subscription/complete?session_id={CHECKOUT_SESSION_ID}`,
    });
    
    res.json({ clientSecret: session.client_secret });
    
  } catch (error) {
    console.error('Checkout session error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Get session status
router.get('/session-status', async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.session_id as string;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    res.json({
      status: session.status,
      customerEmail: session.customer_email,
    });
    
  } catch (error) {
    console.error('Session status error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to get session status' });
  }
});

export default router;

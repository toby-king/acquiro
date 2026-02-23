# Acquiro Setup Guide

This guide will help you set up both the frontend and backend for the Acquiro application.

## Prerequisites

- Node.js 18+ and npm
- Stripe account with API keys
- Stripe product with monthly and annual prices configured

## Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

3. Configure `.env`:
   - Add your Stripe publishable key: `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`
   - Set API URL: `VITE_API_URL=http://localhost:3001`
   - Add other required keys (Bubble API, OpenAI, ElevenLabs)

4. Start the frontend:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

4. Configure `.env`:
   - Add your Stripe secret key: `STRIPE_SECRET_KEY=sk_test_...`
   - Add Price IDs from Stripe Dashboard:
     - `STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID=price_...`
     - `STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID=price_...`
   - Set frontend URL: `FRONTEND_URL=http://localhost:5173`

5. Start the backend:
```bash
npm run dev
```

Backend will run on `http://localhost:3001`

## Getting Stripe Price IDs

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products**
3. Click on your **Professional** product
4. You'll see prices listed - copy the **Price ID** (starts with `price_`)
5. If you only have one price, create a second one:
   - Click **Add another price**
   - Set amount (£1/month or £12/year for annual)
   - Set billing period (monthly or annual)
   - Copy the new Price ID

## Running Both Servers

You'll need to run both frontend and backend simultaneously:

**Terminal 1 (Frontend):**
```bash
npm run dev
```

**Terminal 2 (Backend):**
```bash
cd server
npm run dev
```

## Testing the Integration

1. Start both servers
2. Navigate to `http://localhost:5173`
3. Complete the advisor setup wizard
4. Go through the call flow
5. Click "Continue" after the call
6. On the subscription page, click "Get Started"
7. The Stripe checkout modal should open

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that CORS is properly configured in `server/src/index.ts`

### Stripe Errors
- Verify your Stripe keys are correct
- Check that Price IDs match your Stripe product prices
- Ensure you're using test keys (starts with `pk_test_` and `sk_test_`)

### API Connection Errors
- Verify backend is running on port 3001
- Check `VITE_API_URL` in frontend `.env` matches backend URL
- Check browser console for detailed error messages

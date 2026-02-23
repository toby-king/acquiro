# Acquiro Backend API

Backend server for Acquiro Stripe checkout integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

3. Configure your `.env` file:
   - Add your Stripe secret key
   - Add your Stripe Price IDs for monthly and annual plans
   - Set `FRONTEND_URL` to match your frontend URL

## Running

### Development
```bash
npm run dev
```

The server will start on `http://localhost:3001` (or the PORT specified in `.env`).

### Production
```bash
npm run build
npm start
```

## API Endpoints

### POST `/api/checkout/create-checkout-session`
Creates a Stripe embedded checkout session.

**Request Body:**
```json
{
  "billingPeriod": "monthly" | "annual",
  "userId": "optional_user_id",
  "userEmail": "user@example.com"
}
```

**Response:**
```json
{
  "clientSecret": "cs_test_..."
}
```

### GET `/api/checkout/session-status?session_id=cs_test_...`
Gets the status of a checkout session.

**Response:**
```json
{
  "status": "complete" | "open" | "expired",
  "customerEmail": "user@example.com"
}
```

### GET `/health`
Health check endpoint.

## Deploying to Vercel (acquiro-backend.vercel.app)

1. Create a Vercel project and set **Root Directory** to `server` (if the repo contains both frontend and backend).
2. Set **Environment Variables** in the Vercel project:
   - `FRONTEND_URL` = `https://acquirolabs.vercel.app`
   - `STRIPE_SECRET_KEY`, `STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID`, `STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID`
3. Deploy. The Express app at `src/app.ts` is used as the serverless entry (Vercel zero-config Express).
4. Stripe checkout return URLs will use `FRONTEND_URL`, so users are redirected to the frontend after payment.

## Getting Stripe Price IDs

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products**
3. Click on your **Professional** product
4. Copy the **Price ID** (starts with `price_`) for each billing period
5. Add them to your `.env` file

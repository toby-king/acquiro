import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import checkoutRoutes from './routes/checkout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env (multiple paths for local dev; Vercel injects env)
const envPaths = [
  resolve(__dirname, '../.env'),
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'server/.env'),
];
for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) break;
}
dotenv.config();

// Validate required environment variables (skip on Vercel build if not set yet)
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID',
  'STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID',
];
const missingVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingVars.length > 0 && process.env.VERCEL !== '1') {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [
  ...new Set([
    FRONTEND_URL,
    'https://acquirolabs.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean)),
];

const app = express();
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Acquiro Backend API', health: '/health', checkout: '/api/checkout' });
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/checkout', checkoutRoutes);

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;

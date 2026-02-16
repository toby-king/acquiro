import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import checkoutRoutes from './routes/checkout.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple paths for .env file
const envPaths = [
  resolve(__dirname, '../.env'),           // server/.env (relative to src/)
  resolve(process.cwd(), '.env'),          // Current working directory
  resolve(process.cwd(), 'server/.env'),   // If running from project root
];

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Trying to load .env from:', envPaths);

let envLoaded = false;
for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`✅ Loaded .env from: ${envPath}`);
    envLoaded = true;
    break;
  } else {
    console.log(`❌ Failed to load from ${envPath}:`, result.error.message);
  }
}

if (!envLoaded) {
  console.warn('⚠️  Could not load .env from any path, trying default location...');
  const defaultResult = dotenv.config(); // Try default (current directory)
  if (defaultResult.error) {
    console.error('❌ Failed to load .env from default location:', defaultResult.error.message);
  } else {
    console.log('✅ Loaded .env from default location');
  }
}

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID',
  'STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease check your .env file in the server directory.');
  process.exit(1);
}

// Log loaded price IDs (for debugging)
console.log('✅ Environment variables loaded:');
console.log(`   Monthly Price ID: ${process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID}`);
console.log(`   Annual Price ID: ${process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID}`);

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/checkout', checkoutRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Frontend URL: ${FRONTEND_URL}`);
});

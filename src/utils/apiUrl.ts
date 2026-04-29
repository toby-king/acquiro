const PRODUCTION_BACKEND = 'https://acquiro-backend.vercel.app';

/**
 * Backend API base URL.
 * When served from a real domain (not localhost), always points to the production
 * backend — avoids "Failed to fetch" if VITE_API_URL was set to localhost at build time.
 */
export const API_URL = (() => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') return PRODUCTION_BACKEND;
  }
  return (
    (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '') ||
    (import.meta.env.PROD ? PRODUCTION_BACKEND : 'http://localhost:3001')
  );
})();

/** Backend API base URL — trailing slash stripped to prevent double-slash URLs */
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

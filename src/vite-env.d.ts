/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUBBLE_API_TOKEN: string;
  readonly VITE_BUBBLE_API_BASE_URL: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_ELEVENLABS_AGENT_ID: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

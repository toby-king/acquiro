/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUBBLE_API_TOKEN: string;
  readonly VITE_BUBBLE_API_BASE_URL: string;
  readonly VITE_OPENAI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

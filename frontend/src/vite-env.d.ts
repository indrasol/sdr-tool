/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_SERVICE_KEY: string;
  readonly VITE_SUPABASE_API_KEY: string;
  readonly VITE_BASE_API_URL: string;
  readonly VITE_DEV_BASE_API_URL: string;
  // add more environment variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

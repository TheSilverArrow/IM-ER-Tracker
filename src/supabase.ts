import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = 'clinical_supabase_url_v1';
const SUPABASE_ANON_KEY = 'clinical_supabase_anon_v1';

// Read from import.meta.env (Vite) or process.env with local override support
const metaEnv =
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env) ||
  (typeof process !== 'undefined' && process.env) ||
  {};

export function getEnvSupabaseConfig(): { url: string; key: string } {
  const meta = (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env) || {};
  const proc = typeof process !== 'undefined' && process.env ? process.env : {};

  const url =
    meta.VITE_SUPABASE_URL ||
    meta.SUPABASE_URL ||
    proc.VITE_SUPABASE_URL ||
    proc.SUPABASE_URL ||
    '';

  const key =
    meta.VITE_SUPABASE_ANON_KEY ||
    meta.VITE_SUPABASE_KEY ||
    meta.SUPABASE_ANON_KEY ||
    meta.SUPABASE_KEY ||
    proc.VITE_SUPABASE_ANON_KEY ||
    proc.VITE_SUPABASE_KEY ||
    proc.SUPABASE_ANON_KEY ||
    proc.SUPABASE_KEY ||
    '';

  return { url: url.trim(), key: key.trim() };
}

export function getSupabaseConfig(): { url: string; key: string } {
  const envConfig = getEnvSupabaseConfig();
  let url = envConfig.url;
  let key = envConfig.key;

  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem(SUPABASE_URL_KEY);
    const localKey = localStorage.getItem(SUPABASE_ANON_KEY);
    if (localUrl) url = localUrl;
    if (localKey) key = localKey;
  }

  return { url: url.trim(), key: key.trim() };
}

export function isUsingEnvDefaults(): { isEnvUrl: boolean; isEnvKey: boolean } {
  if (typeof window === 'undefined') return { isEnvUrl: true, isEnvKey: true };
  const envConfig = getEnvSupabaseConfig();
  const localUrl = localStorage.getItem(SUPABASE_URL_KEY);
  const localKey = localStorage.getItem(SUPABASE_ANON_KEY);

  return {
    isEnvUrl: Boolean(!localUrl && envConfig.url),
    isEnvKey: Boolean(!localKey && envConfig.key),
  };
}

export function clearLocalSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SUPABASE_URL_KEY);
    localStorage.removeItem(SUPABASE_ANON_KEY);
  }
}

export function saveSupabaseConfig(url: string, key: string): void {
  if (typeof window !== 'undefined') {
    if (url.trim()) localStorage.setItem(SUPABASE_URL_KEY, url.trim());
    else localStorage.removeItem(SUPABASE_URL_KEY);

    if (key.trim()) localStorage.setItem(SUPABASE_ANON_KEY, key.trim());
    else localStorage.removeItem(SUPABASE_ANON_KEY);
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();

  if (!url || !key) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key);
    } catch (err) {
      console.error('Failed to create Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

// Re-initialize when settings update
export function resetSupabaseClient(): SupabaseClient | null {
  supabaseInstance = null;
  return getSupabaseClient();
}

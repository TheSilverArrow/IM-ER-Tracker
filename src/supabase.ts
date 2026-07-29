import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = 'clinical_supabase_url_v1';
const SUPABASE_ANON_KEY = 'clinical_supabase_anon_v1';

// Read from import.meta.env (Vite) with local override support
const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

export function getSupabaseConfig(): { url: string; key: string } {
  let url = metaEnv.VITE_SUPABASE_URL || '';
  let key = metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.VITE_SUPABASE_KEY || '';

  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem(SUPABASE_URL_KEY);
    const localKey = localStorage.getItem(SUPABASE_ANON_KEY);
    if (localUrl) url = localUrl;
    if (localKey) key = localKey;
  }

  return { url: url.trim(), key: key.trim() };
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

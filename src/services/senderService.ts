import { getSupabaseClient } from '../supabase';

const BLOCKED_SENDERS_KEY = 'blocked_clinical_senders_v1';
const defaultBlockedSenders = ['Intern', 'Dr. Intern', 'Medical Student'];

// Local broadcast channel for multi-tab sync
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel('muted_senders_channel');
  }
} catch {
  // Fallback if BroadcastChannel not supported
}

export function getBlockedSenders(): string[] {
  try {
    const raw = localStorage.getItem(BLOCKED_SENDERS_KEY);
    if (!raw) {
      localStorage.setItem(BLOCKED_SENDERS_KEY, JSON.stringify(defaultBlockedSenders));
      return defaultBlockedSenders;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return defaultBlockedSenders;
  } catch {
    return defaultBlockedSenders;
  }
}

export function saveBlockedSenders(senders: string[]): void {
  try {
    const clean = Array.from(new Set(senders.map((s) => s.trim()).filter((s) => s.length > 0)));
    localStorage.setItem(BLOCKED_SENDERS_KEY, JSON.stringify(clean));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'MUTED_SENDERS_UPDATED', senders: clean });
    }
  } catch (e) {
    console.error('Error saving blocked senders:', e);
  }
}

export function isSenderBlocked(senderName: string, blockedList?: string[]): boolean {
  if (!senderName) return false;
  const list = blockedList && blockedList.length > 0 ? blockedList : getBlockedSenders();
  const lowerSender = senderName.toLowerCase().trim();

  return list.some((blocked) => {
    const lowerBlocked = blocked.toLowerCase().trim();
    if (!lowerBlocked) return false;
    return lowerSender.includes(lowerBlocked) || lowerBlocked.includes(lowerSender);
  });
}

/**
 * Sync muted senders from Supabase DB
 */
export async function fetchSupabaseMutedSenders(): Promise<string[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // 1. Try 'muted_senders' table
    const { data: mutedData, error: mutedErr } = await client
      .from('muted_senders')
      .select('*');

    if (!mutedErr && mutedData && Array.isArray(mutedData)) {
      const names = mutedData
        .map((row) => row.name || row.sender_name || row.sender)
        .filter(Boolean)
        .map((s) => String(s).trim());

      if (names.length > 0) {
        saveBlockedSenders(names);
        return names;
      }
    }

    // 2. Try 'app_settings' or 'settings' table with key='muted_senders'
    const { data: settingsData, error: settingsErr } = await client
      .from('app_settings')
      .select('value')
      .eq('key', 'muted_senders')
      .single();

    if (!settingsErr && settingsData && settingsData.value) {
      const parsed = Array.isArray(settingsData.value)
        ? settingsData.value
        : typeof settingsData.value === 'string'
        ? JSON.parse(settingsData.value)
        : null;

      if (Array.isArray(parsed) && parsed.length > 0) {
        saveBlockedSenders(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Supabase muted senders fetch exception:', err);
  }

  return null;
}

/**
 * Add a muted sender to Supabase & Local storage
 */
export async function addMutedSender(senderName: string): Promise<string[]> {
  const clean = senderName.trim();
  if (!clean) return getBlockedSenders();

  const current = getBlockedSenders();
  if (!current.some((s) => s.toLowerCase() === clean.toLowerCase())) {
    current.push(clean);
  }
  saveBlockedSenders(current);

  const client = getSupabaseClient();
  if (client) {
    try {
      // Try inserting into 'muted_senders' table
      await client.from('muted_senders').insert([{ name: clean, sender_name: clean }]).select();

      // Also update 'app_settings' table for fallback
      await client
        .from('app_settings')
        .upsert([{ key: 'muted_senders', value: current }], { onConflict: 'key' });
    } catch (err) {
      console.warn('Failed to persist muted sender to Supabase:', err);
    }
  }

  return current;
}

/**
 * Remove a muted sender from Supabase & Local storage
 */
export async function removeMutedSender(senderName: string): Promise<string[]> {
  const clean = senderName.trim();
  const current = getBlockedSenders().filter(
    (s) => s.toLowerCase().trim() !== clean.toLowerCase()
  );
  saveBlockedSenders(current);

  const client = getSupabaseClient();
  if (client) {
    try {
      // Try deleting from 'muted_senders' table
      await client.from('muted_senders').delete().ilike('name', clean);
      await client.from('muted_senders').delete().ilike('sender_name', clean);

      // Also update 'app_settings' table
      await client
        .from('app_settings')
        .upsert([{ key: 'muted_senders', value: current }], { onConflict: 'key' });
    } catch (err) {
      console.warn('Failed to remove muted sender from Supabase:', err);
    }
  }

  return current;
}

/**
 * Subscribe to realtime changes for muted senders across all connected devices/browsers
 */
export function subscribeToMutedSendersRealtime(onUpdate: (senders: string[]) => void): () => void {
  const cleanupFns: Array<() => void> = [];

  // Listen to local BroadcastChannel
  if (broadcastChannel) {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'MUTED_SENDERS_UPDATED' && Array.isArray(e.data.senders)) {
        onUpdate(e.data.senders);
      }
    };
    broadcastChannel.addEventListener('message', handleMessage);
    cleanupFns.push(() => broadcastChannel?.removeEventListener('message', handleMessage));
  }

  // Listen to window storage events
  const handleStorage = (e: StorageEvent) => {
    if (e.key === BLOCKED_SENDERS_KEY) {
      onUpdate(getBlockedSenders());
    }
  };
  window.addEventListener('storage', handleStorage);
  cleanupFns.push(() => window.removeEventListener('storage', handleStorage));

  // Listen to Supabase Realtime
  const client = getSupabaseClient();
  if (client) {
    try {
      const channel = client
        .channel('public:muted_senders_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'muted_senders' },
          async () => {
            console.log('🔄 Realtime update on muted_senders table');
            const fresh = await fetchSupabaseMutedSenders();
            if (fresh) onUpdate(fresh);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_settings', filter: 'key=eq.muted_senders' },
          async () => {
            console.log('🔄 Realtime update on app_settings muted_senders');
            const fresh = await fetchSupabaseMutedSenders();
            if (fresh) onUpdate(fresh);
          }
        )
        .subscribe();

      cleanupFns.push(() => {
        client.removeChannel(channel);
      });
    } catch (err) {
      console.warn('Failed to subscribe to muted senders realtime channel:', err);
    }
  }

  return () => {
    cleanupFns.forEach((fn) => fn());
  };
}


import { getSupabaseClient } from '../supabase';
import { ClinicalOrder, OrderItem, OrderStatus } from '../types';
import { fallbackParseMessage } from '../utils/parser';

export function parseSupabaseRow(row: any): ClinicalOrder {
  const rawText = row.text || row.raw_text || row.message || '';
  const parsed = fallbackParseMessage(rawText || `Order #${row.id || 'new'}`);

  let items: OrderItem[] = [];
  if (Array.isArray(row.items) && row.items.length > 0) {
    items = row.items.map((it: any, idx: number) => {
      if (typeof it === 'string') {
        return { id: `it-${row.id || 'sb'}-${idx}`, item_text: it, is_completed: false };
      }
      return {
        id: it.id || `it-${row.id || 'sb'}-${idx}`,
        item_text: it.item_text || it.text || String(it),
        is_completed: Boolean(it.is_completed || it.completed),
      };
    });
  }

  const createdAtNum = row.created_at
    ? new Date(row.created_at).getTime()
    : Date.now();

  const normStatus = (row.status || '').toString().trim().toLowerCase();
  let status: OrderStatus = 'Pending';
  if (normStatus === 'done' || normStatus === 'completed') {
    status = 'Done';
  } else if (
    normStatus === 'in progress' ||
    normStatus === 'in_progress' ||
    normStatus === 'active' ||
    normStatus === 'active tracked' ||
    normStatus === 'approved' ||
    normStatus === 'processing'
  ) {
    status = 'In Progress';
  } else if (normStatus === 'pending') {
    status = 'Pending';
  } else if (['Pending', 'In Progress', 'Done'].includes(row.status)) {
    status = row.status as OrderStatus;
  }

  const patient_name = row.patient_name || rawText || 'STAT Message';

  const rawBed = row.bed_number;
  const bed_number =
    !rawBed || rawBed === 'Unassigned' || rawBed === 'Bed Unassigned'
      ? parsed.bed_number
      : rawBed;

  const rawSenderCandidate =
    row.sender ||
    row.sender_name ||
    row.ordered_by ||
    row.from_user ||
    row.username ||
    row.author ||
    row.doctor ||
    row.created_by ||
    row.telegram_user ||
    row.user_name ||
    row.user ||
    row.from ||
    row.sender_username;

  let finalSender = (rawSenderCandidate && String(rawSenderCandidate).trim() !== 'null' && String(rawSenderCandidate).trim() !== 'undefined')
    ? String(rawSenderCandidate).trim()
    : null;

  if (!finalSender) {
    if (parsed.ordered_by && parsed.ordered_by !== 'Dr. Rounding') {
      finalSender = parsed.ordered_by;
    } else {
      finalSender = 'Telegram Sender';
    }
  }

  return {
    id: String(row.id || `sb-${Date.now()}`),
    patient_name,
    age_sex: row.age_sex && row.age_sex !== 'N/A' ? row.age_sex : parsed.age_sex,
    birthday: row.birthday && row.birthday !== 'Unspecified' ? row.birthday : parsed.birthday,
    bed_number,
    case_number: row.case_number || parsed.case_number,
    ordered_by: finalSender,
    status,
    items,
    raw_text: rawText,
    timestamp: row.created_at || new Date().toISOString(),
    created_at: createdAtNum,
    updated_at: row.updated_at ? new Date(row.updated_at).getTime() : createdAtNum,
  };
}

export async function fetchSupabaseOrders(): Promise<ClinicalOrder[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch orders error:', error.message);
      return null;
    }

    if (data && Array.isArray(data)) {
      return data.map(parseSupabaseRow);
    }
  } catch (err) {
    console.warn('Supabase fetch exception:', err);
  }

  return null;
}

export async function insertSupabaseOrder(rawText: string, senderName?: string): Promise<ClinicalOrder | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const payload = {
      text: rawText,
      patient_name: 'Raw Pending Message',
      ordered_by: senderName || 'Telegram User',
      status: 'Pending',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('orders')
      .insert([payload])
      .select();

    if (error) {
      console.warn('Supabase insert order error:', error.message);
      return null;
    }

    if (data && data[0]) {
      return parseSupabaseRow(data[0]);
    }
  } catch (err) {
    console.warn('Supabase insert exception:', err);
  }

  return null;
}

export async function updateSupabaseOrder(id: string, updates: Record<string, any>): Promise<ClinicalOrder | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const isNumericStr = /^\d+$/.test(String(id));
  const numericId = isNumericStr ? parseInt(String(id), 10) : null;

  const execUpdate = async (filterId: string | number, payload: Record<string, any>) => {
    return await client
      .from('orders')
      .update(payload)
      .eq('id', filterId)
      .select();
  };

  try {
    // 1. Try full payload with string ID or numeric ID
    let { data, error } = await execUpdate(id, updates);
    if ((error || !data || data.length === 0) && numericId !== null) {
      const res = await execUpdate(numericId, updates);
      if (res.data && res.data[0]) {
        data = res.data;
        error = res.error;
      }
    }

    if (!error && data && data[0]) {
      return parseSupabaseRow(data[0]);
    }

    // 2. Try minimal core columns fallback
    const coreUpdates: Record<string, any> = {};
    if (updates.status) coreUpdates.status = updates.status;
    if (updates.patient_name) coreUpdates.patient_name = updates.patient_name;
    if (updates.ordered_by) coreUpdates.ordered_by = updates.ordered_by;

    let fallbackRes = await execUpdate(id, coreUpdates);
    if ((fallbackRes.error || !fallbackRes.data || fallbackRes.data.length === 0) && numericId !== null) {
      fallbackRes = await execUpdate(numericId, coreUpdates);
    }

    if (!fallbackRes.error && fallbackRes.data && fallbackRes.data[0]) {
      return parseSupabaseRow(fallbackRes.data[0]);
    }

    // 3. Fallback to updating ONLY status
    if (updates.status) {
      let statusRes = await execUpdate(id, { status: updates.status });
      if ((statusRes.error || !statusRes.data || statusRes.data.length === 0) && numericId !== null) {
        statusRes = await execUpdate(numericId, { status: updates.status });
      }

      if (!statusRes.error && statusRes.data && statusRes.data[0]) {
        return parseSupabaseRow(statusRes.data[0]);
      }
    }
  } catch (err) {
    console.warn('Supabase update exception:', err);
  }

  return null;
}

export async function deleteSupabaseOrder(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const isNumericStr = /^\d+$/.test(String(id));
  const numericId = isNumericStr ? parseInt(String(id), 10) : null;

  try {
    let { error } = await client.from('orders').delete().eq('id', id);
    if (error && numericId !== null) {
      const res = await client.from('orders').delete().eq('id', numericId);
      if (!res.error) error = null;
    }
    if (error) {
      console.warn('Supabase delete order error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase delete exception:', err);
    return false;
  }
}

export function subscribeToSupabaseRealtime(callbacks: {
  onInsert?: (order: ClinicalOrder) => void;
  onUpdate?: (order: ClinicalOrder) => void;
  onDelete?: (id: string) => void;
}) {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    const channel = client
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('📥 Supabase Realtime Event:', payload.eventType, payload);

          if (payload.eventType === 'INSERT' && payload.new) {
            const order = parseSupabaseRow(payload.new);
            callbacks.onInsert?.(order);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const order = parseSupabaseRow(payload.new);
            callbacks.onUpdate?.(order);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            callbacks.onDelete?.(String(payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Failed to subscribe to Supabase channel:', err);
    return () => {};
  }
}

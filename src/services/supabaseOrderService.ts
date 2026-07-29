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
  } else if (parsed.items.length > 0) {
    items = parsed.items.map((itemText, idx) => ({
      id: `it-${row.id || 'sb'}-${idx}`,
      item_text: itemText,
      is_completed: false,
    }));
  }

  const createdAtNum = row.created_at
    ? new Date(row.created_at).getTime()
    : Date.now();

  const status: OrderStatus = ['Pending', 'In Progress', 'Done'].includes(row.status)
    ? row.status
    : 'Pending';

  return {
    id: String(row.id || `sb-${Date.now()}`),
    patient_name: row.patient_name || parsed.patient_name,
    age_sex: row.age_sex || parsed.age_sex,
    birthday: row.birthday || parsed.birthday,
    bed_number: row.bed_number || parsed.bed_number,
    case_number: row.case_number || parsed.case_number,
    ordered_by: row.ordered_by || parsed.ordered_by,
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

export async function insertSupabaseOrder(rawText: string): Promise<ClinicalOrder | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const parsed = fallbackParseMessage(rawText);
    const payload = {
      text: rawText,
      patient_name: parsed.patient_name,
      age_sex: parsed.age_sex,
      bed_number: parsed.bed_number,
      ordered_by: parsed.ordered_by,
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

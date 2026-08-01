import { ClinicalOrder, OrderItem, OrderStatus } from '../types';
import { parseTelegramTextClientSide } from '../utils/parser';
import { fetchSupabaseOrders, insertSupabaseOrder, updateSupabaseOrder, deleteSupabaseOrder } from './supabaseOrderService';
import { isStatMessage } from '../utils/statFilter';

const STORAGE_KEY = 'clinical_orders_gh_pages_v1';
export const DEFAULT_VERCEL_API_URL = 'https://im-er-tracker-4akzsrg8x-silver-arrow.vercel.app';

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;

export function getApiUrl(path: string): string {
  // If explicitly set via environment variable
  if (metaEnv?.VITE_API_BASE_URL) {
    const base = metaEnv.VITE_API_BASE_URL.replace(/\/+$/, '');
    return `${base}${path}`;
  }

  // If running locally or on the Cloud Run development environment, relative paths work
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.includes('run.app')) {
      return path;
    }
  }

  // Default to Vercel API backend for GitHub Pages or static deployments
  return `${DEFAULT_VERCEL_API_URL}${path}`;
}

// Initial sample orders for fallback offline / static mode
const initialSampleOrders: ClinicalOrder[] = [];

function getLocalOrders(): ClinicalOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: ClinicalOrder[] = JSON.parse(raw);
    // Filter out any legacy initial sample orders if present
    const clean = parsed.filter((o) => !['ord-101', 'ord-102', 'ord-103'].includes(o.id));
    return clean;
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: ClinicalOrder[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('LocalStorage save error', e);
  }
}

export const orderService = {
  async getOrders(): Promise<ClinicalOrder[]> {
    // 1. Try fetching directly from Supabase first
    const sbOrders = await fetchSupabaseOrders();
    if (sbOrders && sbOrders.length > 0) {
      const validStatOrders: ClinicalOrder[] = [];
      for (const order of sbOrders) {
        if (isStatMessage(order)) {
          validStatOrders.push(order);
        } else {
          // Immediately purge non-STAT message from Supabase right away
          deleteSupabaseOrder(order.id).catch(() => {});
        }
      }
      return validStatOrders;
    }

    // 2. Try fetching from Express API endpoint if available
    try {
      const res = await fetch(getApiUrl('/api/orders'));
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          return data.orders.filter((o: ClinicalOrder) => isStatMessage(o));
        }
      }
    } catch {
      // API unavailable or static environment (GitHub Pages)
    }

    return getLocalOrders().filter((o) => isStatMessage(o));
  },

  async createOrderFromText(rawText: string, senderName?: string): Promise<ClinicalOrder> {
    // 1. Try inserting directly into Supabase first (as raw Pending item)
    const sbOrder = await insertSupabaseOrder(rawText, senderName);
    if (sbOrder) return sbOrder;

    // 2. Try posting to Express / Vercel API
    try {
      const res = await fetch(getApiUrl('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText, sender: senderName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) return data.order;
      }
    } catch {
      // Fallback
    }

    // Client-side execution: create raw Pending tile WITHOUT running pre-parsing
    const newOrder: ClinicalOrder = {
      id: `ord-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      patient_name: 'Raw Pending Message',
      age_sex: 'N/A',
      birthday: 'Unspecified',
      bed_number: 'Unassigned',
      case_number: `CN-${Math.floor(10000 + Math.random() * 90000)}`,
      ordered_by: senderName || 'Telegram User',
      status: 'Pending',
      items: [],
      raw_text: rawText,
      timestamp: new Date().toISOString(),
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const current = getLocalOrders();
    const updated = [newOrder, ...current];
    saveLocalOrders(updated);
    return newOrder;
  },

  async approveAndParseOrder(id: string, rawTextOverride?: string, existingOrder?: ClinicalOrder): Promise<ClinicalOrder> {
    const current = getLocalOrders();
    const targetOrder = existingOrder || current.find((o) => o.id === id);

    let textToDisplay = rawTextOverride || targetOrder?.raw_text || '';
    if (!textToDisplay || textToDisplay === 'Raw Pending Message') {
      if (targetOrder?.raw_text) {
        textToDisplay = targetOrder.raw_text;
      } else if (targetOrder?.patient_name && targetOrder.patient_name !== 'Raw Pending Message') {
        textToDisplay = targetOrder.patient_name;
      } else {
        textToDisplay = 'STAT Order';
      }
    }

    // Extract bed number if present or keep existing / fallback to ER Bed
    let bed = targetOrder?.bed_number && targetOrder.bed_number !== 'Unassigned' ? targetOrder.bed_number : '';
    if (!bed) {
      const bedMatch = textToDisplay.match(/\b(Bed\s+[\w\d]+|ICU\s+[\w\d]+|\d{3}[A-Z]?)\b/i);
      bed = bedMatch ? bedMatch[0] : 'ER Bed';
    }

    const patientName = targetOrder?.patient_name && targetOrder.patient_name !== 'Raw Pending Message'
      ? targetOrder.patient_name
      : (textToDisplay.length > 45 ? textToDisplay.slice(0, 45) + '...' : textToDisplay);

    const orderItems: OrderItem[] = (targetOrder?.items && targetOrder.items.length > 0)
      ? targetOrder.items
      : [{
          id: `it-${Date.now().toString(36)}-0`,
          item_text: textToDisplay,
          is_completed: false,
        }];

    const updatePayload = {
      patient_name: patientName,
      bed_number: bed,
      status: 'In Progress' as OrderStatus,
      items: orderItems,
      raw_text: textToDisplay,
      updated_at: Date.now(),
    };

    // 1. Try updating Supabase
    const sbUpdated = await updateSupabaseOrder(id, {
      patient_name: patientName,
      bed_number: bed,
      status: 'In Progress',
      items: orderItems,
      raw_text: textToDisplay,
    });

    if (sbUpdated) {
      const idx = current.findIndex((o) => o.id === id);
      if (idx !== -1) {
        current[idx] = sbUpdated;
      } else {
        current.unshift(sbUpdated);
      }
      saveLocalOrders(current);
      return sbUpdated;
    }

    // 2. Local storage fallback
    const idx = current.findIndex((o) => o.id === id);
    if (idx === -1) {
      const newOrder: ClinicalOrder = {
        id,
        patient_name: patientName,
        age_sex: targetOrder?.age_sex || 'N/A',
        birthday: targetOrder?.birthday || 'Unspecified',
        bed_number: bed,
        case_number: targetOrder?.case_number || `CN-${Math.floor(10000 + Math.random() * 90000)}`,
        ordered_by: targetOrder?.ordered_by || 'Dr. Rounding',
        status: 'In Progress',
        items: orderItems,
        raw_text: textToDisplay,
        timestamp: targetOrder?.timestamp || new Date().toISOString(),
        created_at: targetOrder?.created_at || Date.now(),
        updated_at: Date.now(),
      };
      saveLocalOrders([newOrder, ...current]);
      return newOrder;
    }

    const updatedOrder: ClinicalOrder = {
      ...current[idx],
      ...updatePayload,
      status: 'In Progress',
    };
    current[idx] = updatedOrder;
    saveLocalOrders(current);
    return updatedOrder;
  },

  async updateStatus(id: string, status: OrderStatus): Promise<ClinicalOrder> {
    updateSupabaseOrder(id, { status }).catch(() => {});
    try {
      const res = await fetch(getApiUrl(`/api/orders/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) return data.order;
      }
    } catch {
      // Fallback
    }

    const current = getLocalOrders();
    const idx = current.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error('Order not found');

    const updatedOrder = {
      ...current[idx],
      status,
      updated_at: Date.now(),
    };
    current[idx] = updatedOrder;
    saveLocalOrders(current);
    return updatedOrder;
  },

  async toggleItem(orderId: string, itemId: string, isCompleted: boolean): Promise<ClinicalOrder> {
    const current = getLocalOrders();
    const idx = current.findIndex((o) => o.id === orderId);
    const order = idx !== -1 ? current[idx] : null;

    let updatedItems: OrderItem[] = [];
    let newStatus: OrderStatus = 'In Progress';

    if (order) {
      updatedItems = order.items.map((it) =>
        it.id === itemId ? { ...it, is_completed: isCompleted } : it
      );
      const allCompleted = updatedItems.length > 0 && updatedItems.every((it) => it.is_completed);
      if (allCompleted) {
        newStatus = 'Done';
      } else if (order.status === 'Done') {
        newStatus = 'In Progress';
      } else {
        newStatus = order.status;
      }
    }

    // Persist to Supabase
    updateSupabaseOrder(orderId, {
      items: updatedItems,
      status: newStatus,
    }).catch(() => {});

    try {
      const res = await fetch(getApiUrl(`/api/orders/${orderId}/items/${itemId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: isCompleted }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          if (idx !== -1) {
            current[idx] = data.order;
            saveLocalOrders(current);
          }
          return data.order;
        }
      }
    } catch {
      // Fallback
    }

    if (idx === -1) throw new Error('Order not found');

    const updatedOrder: ClinicalOrder = {
      ...order!,
      items: updatedItems,
      status: newStatus,
      updated_at: Date.now(),
    };

    current[idx] = updatedOrder;
    saveLocalOrders(current);
    return updatedOrder;
  },

  async completeAllItems(orderId: string): Promise<ClinicalOrder> {
    const current = getLocalOrders();
    const idx = current.findIndex((o) => o.id === orderId);
    const order = idx !== -1 ? current[idx] : null;

    let updatedItems: OrderItem[] = [];
    if (order) {
      updatedItems = order.items.map((it) => ({ ...it, is_completed: true }));
    }

    // Persist to Supabase
    updateSupabaseOrder(orderId, {
      items: updatedItems,
      status: 'Done',
    }).catch(() => {});

    try {
      const res = await fetch(getApiUrl(`/api/orders/${orderId}/complete-all`), { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          if (idx !== -1) {
            current[idx] = data.order;
            saveLocalOrders(current);
          }
          return data.order;
        }
      }
    } catch {
      // Fallback
    }

    if (idx === -1) throw new Error('Order not found');

    const updatedOrder: ClinicalOrder = {
      ...order!,
      items: updatedItems,
      status: 'Done',
      updated_at: Date.now(),
    };

    current[idx] = updatedOrder;
    saveLocalOrders(current);
    return updatedOrder;
  },

  async deleteOrder(id: string): Promise<void> {
    await deleteSupabaseOrder(id).catch(() => {});
    try {
      await fetch(getApiUrl(`/api/orders/${id}`), { method: 'DELETE' });
    } catch {
      // Fallback
    }

    const current = getLocalOrders();
    const filtered = current.filter((o) => o.id !== id);
    saveLocalOrders(filtered);
  },

  async resetSeedData(): Promise<ClinicalOrder[]> {
    try {
      const res = await fetch(getApiUrl('/api/orders/seed'), { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) return data.orders;
      }
    } catch {
      // Fallback
    }

    saveLocalOrders(initialSampleOrders);
    return initialSampleOrders;
  },

  async simulateWebhook(simText?: string): Promise<{ simulated_text: string; order: ClinicalOrder }> {
    try {
      const res = await fetch(getApiUrl('/api/orders/simulate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: simText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          return { simulated_text: data.simulated_text || simText || '', order: data.order };
        }
      }
    } catch {
      // Fallback
    }

    const textToSimulate =
      simText ||
      'Bed 304 Pt Sarah Jenkins 51F DOB 05/12/1975 STAT blood draw CBC, CMP, PT/INR for GI bleed, plus ECG - Dr. Vance';

    const order = await this.createOrderFromText(textToSimulate);
    return { simulated_text: textToSimulate, order };
  },
};

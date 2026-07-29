import { ClinicalOrder, OrderItem, OrderStatus } from '../types';
import { parseTelegramTextClientSide } from '../utils/parser';
import { fetchSupabaseOrders, insertSupabaseOrder } from './supabaseOrderService';

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
const initialSampleOrders: ClinicalOrder[] = [
  {
    id: 'ord-101',
    patient_name: 'Jonathan Doe',
    age_sex: '58 / M',
    birthday: '1968-03-14',
    bed_number: 'Bed 302-A',
    case_number: 'CN-90412',
    ordered_by: 'Dr. Vance',
    status: 'Pending',
    items: [
      { id: 'it-1', item_text: 'STAT CBC & CMP lab draw', is_completed: false },
      { id: 'it-2', item_text: 'Blood Cultures x2 for spiking fever (38.9°C)', is_completed: false },
      { id: 'it-3', item_text: '12-Lead ECG for sinus tachycardia', is_completed: false },
    ],
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    raw_text: 'Bed 302A Pt Jonathan Doe 58M DOB 03/14/1968 STAT CBC, CMP, Blood cultures x2 for spiking fever 38.9C, plus 12-lead ECG - Dr. Vance',
    created_at: Date.now() - 8 * 60 * 1000,
    updated_at: Date.now() - 8 * 60 * 1000,
  },
  {
    id: 'ord-102',
    patient_name: 'Maria Santos',
    age_sex: '42 / F',
    birthday: '1984-09-22',
    bed_number: 'Bed 412',
    case_number: 'CN-83109',
    ordered_by: 'Dr. Chen',
    status: 'In Progress',
    items: [
      { id: 'it-4', item_text: 'Portable Single View CXR post-intubation', is_completed: true },
      { id: 'it-5', item_text: 'Arterial Blood Gas (ABG) stat', is_completed: false },
      { id: 'it-6', item_text: 'Check endotracheal tube position', is_completed: false },
    ],
    timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    raw_text: 'Bed 412 Maria Santos 42F DOB 09/22/1984 Portable CXR ETT placement check, ABG stat - Dr. Chen',
    created_at: Date.now() - 22 * 60 * 1000,
    updated_at: Date.now() - 10 * 60 * 1000,
  },
  {
    id: 'ord-103',
    patient_name: 'Arthur Reed',
    age_sex: '67 / M',
    birthday: '1959-11-05',
    bed_number: 'Bed 205-B',
    case_number: 'CN-77210',
    ordered_by: 'Dr. Lopez',
    status: 'Done',
    items: [
      { id: 'it-7', item_text: 'Specimen cup for Urine Analysis (UA)', is_completed: true },
      { id: 'it-8', item_text: 'Urine Culture & Sensitivity pre-op', is_completed: true },
    ],
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    raw_text: '205B Arthur Reed 67M DOB 11/05/1959 specimen cup UA and C&S pre-op - Dr. Lopez',
    created_at: Date.now() - 60 * 60 * 1000,
    updated_at: Date.now() - 20 * 60 * 1000,
  },
];

function getLocalOrders(): ClinicalOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSampleOrders));
      return initialSampleOrders;
    }
    return JSON.parse(raw);
  } catch {
    return initialSampleOrders;
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
      return sbOrders;
    }

    // 2. Try fetching from Express API endpoint if available
    try {
      const res = await fetch(getApiUrl('/api/orders'));
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          return data.orders;
        }
      }
    } catch {
      // API unavailable or static environment (GitHub Pages)
    }

    return getLocalOrders();
  },

  async createOrderFromText(rawText: string): Promise<ClinicalOrder> {
    // 1. Try inserting directly into Supabase first
    const sbOrder = await insertSupabaseOrder(rawText);
    if (sbOrder) return sbOrder;

    // 2. Try posting to Express / Vercel API
    try {
      const res = await fetch(getApiUrl('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) return data.order;
      }
    } catch {
      // Fallback
    }

    // Client-side execution
    const parsed = await parseTelegramTextClientSide(rawText);
    const orderItems: OrderItem[] = parsed.items.map((itemText, idx) => ({
      id: `it-${Date.now().toString(36)}-${idx}`,
      item_text: itemText,
      is_completed: false,
    }));

    const newOrder: ClinicalOrder = {
      id: `ord-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      patient_name: parsed.patient_name,
      age_sex: parsed.age_sex,
      birthday: parsed.birthday,
      bed_number: parsed.bed_number,
      case_number: parsed.case_number,
      ordered_by: parsed.ordered_by,
      status: 'Pending',
      items: orderItems,
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

  async updateStatus(id: string, status: OrderStatus): Promise<ClinicalOrder> {
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
    try {
      const res = await fetch(getApiUrl(`/api/orders/${orderId}/items/${itemId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: isCompleted }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) return data.order;
      }
    } catch {
      // Fallback
    }

    const current = getLocalOrders();
    const idx = current.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');

    const order = current[idx];
    const updatedItems = order.items.map((it) =>
      it.id === itemId ? { ...it, is_completed: isCompleted } : it
    );

    const allCompleted = updatedItems.length > 0 && updatedItems.every((it) => it.is_completed);
    let newStatus = order.status;
    if (allCompleted) {
      newStatus = 'Done';
    } else if (order.status === 'Done') {
      newStatus = 'In Progress';
    }

    const updatedOrder: ClinicalOrder = {
      ...order,
      items: updatedItems,
      status: newStatus,
      updated_at: Date.now(),
    };

    current[idx] = updatedOrder;
    saveLocalOrders(current);
    return updatedOrder;
  },

  async completeAllItems(orderId: string): Promise<ClinicalOrder> {
    try {
      const res = await fetch(getApiUrl(`/api/orders/${orderId}/complete-all`), { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) return data.order;
      }
    } catch {
      // Fallback
    }

    const current = getLocalOrders();
    const idx = current.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');

    const order = current[idx];
    const updatedItems = order.items.map((it) => ({ ...it, is_completed: true }));

    const updatedOrder: ClinicalOrder = {
      ...order,
      items: updatedItems,
      status: 'Done',
      updated_at: Date.now(),
    };

    current[idx] = updatedOrder;
    saveLocalOrders(current);
    return updatedOrder;
  },

  async deleteOrder(id: string): Promise<void> {
    try {
      const res = await fetch(getApiUrl(`/api/orders/${id}`), { method: 'DELETE' });
      if (res.ok) return;
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

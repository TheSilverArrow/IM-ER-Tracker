import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for cross-origin requests (e.g., from GitHub Pages frontend)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

export default app;

export type OrderStatus = 'Pending' | 'In Progress' | 'Done';

export interface OrderItem {
  id: string;
  item_text: string;
  is_completed: boolean;
}

export interface ClinicalOrder {
  id: string;
  patient_name: string;
  age_sex: string;
  birthday: string;
  bed_number: string;
  case_number: string;
  ordered_by: string;
  status: OrderStatus;
  items: OrderItem[];
  raw_text?: string;
  topic_id?: string | number;
  timestamp: string;
  created_at: number;
  updated_at: number;
}

// Initial sample orders for hospital rounds
const initialOrders: ClinicalOrder[] = [];

let orders: ClinicalOrder[] = [];

// Gemini AI Setup
function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// Basic message info extraction (NO SORTING, NO PARSING of details)
function fallbackParseMessage(text: string): {
  patient_name: string;
  age_sex: string;
  birthday: string;
  bed_number: string;
  case_number: string;
  ordered_by: string;
  items: string[];
} {
  const bedMatch = text.match(/\b(Bed\s+[A-Za-z0-9-]+|ICU\s+[A-Za-z0-9-]+|Rm\s+[A-Za-z0-9-]+|Room\s+[A-Za-z0-9-]+|\d{3}[A-Z]?)\b/i);
  const bed_number = bedMatch ? (bedMatch[0].toLowerCase().startsWith('bed') ? bedMatch[0] : `Bed ${bedMatch[0]}`) : 'ER Bed';

  const docMatch = text.match(/(?:Dr\.|Doctor|MD)\s*([A-Za-z]+)/i);
  const ordered_by = docMatch ? `Dr. ${docMatch[1]}` : 'Telegram Sender';

  return {
    patient_name: text,
    age_sex: 'N/A',
    birthday: 'Unspecified',
    bed_number,
    case_number: `CN-${Math.floor(10000 + Math.random() * 90000)}`,
    ordered_by,
    items: [],
  };
}

async function parseTelegramTextWithAI(text: string): Promise<{
  patient_name: string;
  age_sex: string;
  birthday: string;
  bed_number: string;
  case_number: string;
  ordered_by: string;
  items: string[];
}> {
  return fallbackParseMessage(text);
}

// API Endpoints

// POST /api/parse - Parse clinical raw message string using Gemini 3.6 Flash
app.post('/api/parse', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'Message text is required' });
    }
    const parsed = await parseTelegramTextWithAI(text);
    return res.json({ success: true, parsed });
  } catch (err: any) {
    console.error('API parse error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Parse failed' });
  }
});

// GET /api/orders
app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    orders: orders.sort((a, b) => b.created_at - a.created_at),
  });
});

// POST /api/orders - Receive Telegram webhook or manual order creation
app.post('/api/orders', async (req, res) => {
  try {
    const body = req.body || {};
    let parsed: {
      patient_name: string;
      age_sex: string;
      birthday: string;
      bed_number: string;
      case_number: string;
      ordered_by: string;
      items: string[];
    };

    let raw_text: string | undefined = undefined;
    const topic_id = body.topic_id || undefined;

    if (body.text && typeof body.text === 'string') {
      raw_text = body.text;
      parsed = await parseTelegramTextWithAI(body.text);
    } else {
      parsed = {
        patient_name: body.patient_name || 'Patient Unassigned',
        age_sex: body.age_sex || 'N/A',
        birthday: body.birthday || 'Unspecified',
        bed_number: body.bed_number || 'Bed Unassigned',
        case_number: body.case_number || `CN-${Math.floor(10000 + Math.random() * 90000)}`,
        ordered_by: body.ordered_by || 'Dr. Rounding',
        items: Array.isArray(body.items) && body.items.length > 0
          ? body.items
          : [body.details || 'General clinical order'],
      };
      raw_text = body.raw_text;
    }

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
      status: 'Pending', // New orders start as Pending for approval
      items: orderItems,
      raw_text,
      topic_id,
      timestamp: new Date().toISOString(),
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    orders.unshift(newOrder);

    res.status(201).json({
      success: true,
      message: 'Clinical order tile created in Pending Queue',
      order: newOrder,
    });
  } catch (err: any) {
    console.error('Error creating order tile:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to process order' });
  }
});

// PATCH /api/orders/:id - Update status or properties
app.patch('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status, patient_name, age_sex, birthday, bed_number, case_number, ordered_by, items } = req.body;

  const orderIndex = orders.findIndex((o) => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, message: 'Order tile not found' });
  }

  const existing = orders[orderIndex];
  const updatedOrder: ClinicalOrder = {
    ...existing,
    ...(status && { status }),
    ...(patient_name && { patient_name }),
    ...(age_sex && { age_sex }),
    ...(birthday && { birthday }),
    ...(bed_number && { bed_number }),
    ...(case_number && { case_number }),
    ...(ordered_by && { ordered_by }),
    ...(items && { items }),
    updated_at: Date.now(),
  };

  orders[orderIndex] = updatedOrder;

  res.json({
    success: true,
    message: 'Order updated',
    order: updatedOrder,
  });
});

// PATCH /api/orders/:id/items/:itemId - Toggle completion of a single checklist item
app.patch('/api/orders/:id/items/:itemId', (req, res) => {
  const { id, itemId } = req.params;
  const { is_completed } = req.body;

  const orderIndex = orders.findIndex((o) => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, message: 'Order tile not found' });
  }

  const order = orders[orderIndex];
  const updatedItems = order.items.map((it) =>
    it.id === itemId ? { ...it, is_completed: Boolean(is_completed) } : it
  );

  // Auto update tile status: if all items are completed, mark as 'Done', else if in progress/pending
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

  orders[orderIndex] = updatedOrder;

  res.json({
    success: true,
    order: updatedOrder,
  });
});

// POST /api/orders/:id/complete-all - Complete all items in tile at once
app.post('/api/orders/:id/complete-all', (req, res) => {
  const { id } = req.params;
  const orderIndex = orders.findIndex((o) => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, message: 'Order tile not found' });
  }

  const order = orders[orderIndex];
  const updatedItems = order.items.map((it) => ({ ...it, is_completed: true }));

  const updatedOrder: ClinicalOrder = {
    ...order,
    items: updatedItems,
    status: 'Done',
    updated_at: Date.now(),
  };

  orders[orderIndex] = updatedOrder;

  res.json({
    success: true,
    message: 'All items marked completed',
    order: updatedOrder,
  });
});

// DELETE /api/orders/:id - Delete / Reject order tile
app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  orders = orders.filter((o) => o.id !== id);

  res.json({
    success: true,
    message: 'Order tile removed',
    id,
  });
});

// POST /api/orders/seed - Reset database to sample tiles
app.post('/api/orders/seed', (req, res) => {
  orders = [...initialOrders];
  res.json({
    success: true,
    message: 'Orders reset to clinical sample set',
    orders,
  });
});

// POST /api/orders/simulate - Simulate incoming Telegram message with multiple orders
const telegramSimulations = [
  'Bed 304 Pt Sarah Jenkins 51F DOB 05/12/1975 STAT blood draw CBC, CMP, PT/INR for GI bleed, plus ECG - Dr. Vance',
  'Bed 212 Robert Paulson 63M DOB 11/03/1962 Specimen cup for sputum culture & AFB stain, plus nebulizer - Dr. Lopez',
  'Bed 408-A Elena Rostova 38F DOB 08/19/1987 Portable CXR urgently for line placement verification, IV Vanc 1g - Dr. Chen',
  'ICU 02 David K. 71M DOB 01/30/1955 STAT IV Furosemide 40mg push, ABG stat, repeat troponin - Dr. Miller',
];

app.post('/api/orders/simulate', async (req, res) => {
  const randomIndex = Math.floor(Math.random() * telegramSimulations.length);
  const simText = req.body.text || telegramSimulations[randomIndex];
  const topic_id = req.body.topic_id || Math.floor(Math.random() * 888 + 100);

  const parsed = await parseTelegramTextWithAI(simText);

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
    raw_text: simText,
    topic_id,
    timestamp: new Date().toISOString(),
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  orders.unshift(newOrder);

  res.status(201).json({
    success: true,
    simulated_text: simText,
    order: newOrder,
  });
});

// Vite & Static serving configuration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Clinical Order Tracker server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

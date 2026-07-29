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
const initialOrders: ClinicalOrder[] = [
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

let orders: ClinicalOrder[] = [...initialOrders];

// Gemini AI Setup
function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback rule parser for Telegram messages
function fallbackParseMessage(text: string): {
  patient_name: string;
  age_sex: string;
  birthday: string;
  bed_number: string;
  case_number: string;
  ordered_by: string;
  items: string[];
} {
  // Bed number extraction
  let bed_number = 'Bed Unassigned';
  const bedMatch = text.match(
    /(?:bed\s*|room\s*|icu\s*-?\s*|ER\s*-?\s*|\b)([0-9]{2,4}[a-zA-Z]?|[0-9]{1,2}-[a-zA-Z]|ICU-[0-9]{1,2})/i
  );
  if (bedMatch && bedMatch[1]) {
    const rawBed = bedMatch[1].toUpperCase();
    bed_number = rawBed.startsWith('BED') || rawBed.startsWith('ICU') ? rawBed : `Bed ${rawBed}`;
  }

  // Doctor name extraction
  let ordered_by = 'Dr. Rounding';
  const docMatch = text.match(/(?:Dr\.|Doctor)\s*([A-Z][a-z]+)/i);
  if (docMatch && docMatch[1]) {
    ordered_by = `Dr. ${docMatch[1]}`;
  }

  // Patient name extraction
  let patient_name = `Patient ${bed_number.replace('Bed ', '')}`;
  const nameMatch = text.match(/(?:Pt|Patient|Name)\.?:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
  if (nameMatch && nameMatch[1]) {
    patient_name = nameMatch[1];
  }

  // Age / Sex extraction
  let age_sex = 'N/A';
  const ageSexMatch = text.match(/\b([0-9]{1,2})\s*\/\s*([MFmf])\b|\b([0-9]{1,2})\s*([MFmf])\b/);
  if (ageSexMatch) {
    const age = ageSexMatch[1] || ageSexMatch[3];
    const sex = (ageSexMatch[2] || ageSexMatch[4]).toUpperCase();
    age_sex = `${age} / ${sex}`;
  }

  // Birthday extraction
  let birthday = 'Unspecified';
  const dobMatch = text.match(/(?:DOB|Birth|Bday)\.?:?\s*([0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})/i);
  if (dobMatch && dobMatch[1]) {
    birthday = dobMatch[1];
  }

  // Case number
  const randNum = Math.floor(10000 + Math.random() * 90000);
  const case_number = `CN-${randNum}`;

  // Simple split items by commas or "and" or newlines
  const rawSegments = text
    .replace(/(?:Bed|Pt|Doctor|Dr\.|DOB|CN-)[^,;]+/gi, '')
    .split(/[,;\n]| and /i)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  const items = rawSegments.length > 0 ? rawSegments : [text.trim()];

  return {
    patient_name,
    age_sex,
    birthday,
    bed_number,
    case_number,
    ordered_by,
    items,
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
  const ai = getGeminiAI();
  if (!ai) {
    return fallbackParseMessage(text);
  }

  try {
    const prompt = `Analyze this clinical round Telegram message and parse all orders into structured JSON:
Message text: "${text}"

Instructions:
1. "patient_name": Extract full name if present (e.g. "Jonathan Doe"), or generate clean realistic patient name if unnamed (e.g., "Patient " + Bed Number).
2. "age_sex": Extract age and biological sex (e.g. "58 / M", "42 / F"), or infer realistic e.g. "52 / M" if missing.
3. "birthday": Date of birth if mentioned (e.g. "1968-03-14"), or realistic DOB string if missing.
4. "bed_number": Extract bed/room/location clearly formatted e.g. "Bed 302-A", "Bed 412", "ICU-04".
5. "case_number": Hospital case/chart number if mentioned or format as "CN-XXXXX" with random numbers.
6. "ordered_by": Doctor or clinician ordering (e.g., "Dr. Vance", "Dr. Chen"), or "Dr. Rounding".
7. "items": Extract array of individual clean clinical order strings (e.g., ["STAT CBC & CMP lab draw", "Blood Cultures x2", "12-Lead ECG"]).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patient_name: { type: Type.STRING },
            age_sex: { type: Type.STRING },
            birthday: { type: Type.STRING },
            bed_number: { type: Type.STRING },
            case_number: { type: Type.STRING },
            ordered_by: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['patient_name', 'bed_number', 'ordered_by', 'items'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const fallback = fallbackParseMessage(text);

    const parsedItems: string[] = Array.isArray(parsed.items) && parsed.items.length > 0
      ? parsed.items.map((i: any) => String(i).trim())
      : fallback.items;

    return {
      patient_name: parsed.patient_name || fallback.patient_name,
      age_sex: parsed.age_sex || fallback.age_sex,
      birthday: parsed.birthday || fallback.birthday,
      bed_number: parsed.bed_number || fallback.bed_number,
      case_number: parsed.case_number || fallback.case_number,
      ordered_by: parsed.ordered_by || fallback.ordered_by,
      items: parsedItems,
    };
  } catch (err) {
    console.error('Gemini parsing error, using fallback:', err);
    return fallbackParseMessage(text);
  }
}

// API Endpoints

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
  const initialCount = orders.length;
  orders = orders.filter((o) => o.id !== id);

  if (orders.length === initialCount) {
    return res.status(404).json({ success: false, message: 'Order tile not found' });
  }

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

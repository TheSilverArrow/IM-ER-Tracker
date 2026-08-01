import { GoogleGenAI, Type } from '@google/genai';

export interface ParsedOrderData {
  patient_name: string;
  age_sex: string;
  birthday: string;
  bed_number: string;
  case_number: string;
  ordered_by: string;
  items: string[];
}

export function extractSenderFromRawText(text: string): string | null {
  if (!text) return null;
  const fromMatch = text.match(/(?:From|Sender|By|User|Doctor|Dr\.?):?\s*@?([A-Za-z0-9_\s\.\-]{2,30})/i);
  if (fromMatch && fromMatch[1]) {
    const val = fromMatch[1].trim();
    if (!val.toLowerCase().startsWith('stat') && !val.toLowerCase().startsWith('case') && val.length > 2) {
      return val.startsWith('Dr.') || val.startsWith('Dr ') ? val : `Dr. ${val}`;
    }
  }

  const dashMatch = text.match(/[-—–]\s*@?([A-Za-z0-9_\.\s]{2,25})\s*$/);
  if (dashMatch && dashMatch[1]) {
    const val = dashMatch[1].trim();
    if (!val.toLowerCase().startsWith('stat') && !val.toLowerCase().startsWith('bed') && val.length > 2) {
      return val;
    }
  }

  const userMatch = text.match(/@([A-Za-z0-9_]{3,20})/);
  if (userMatch && userMatch[1]) {
    return `@${userMatch[1]}`;
  }

  return null;
}

export function fallbackParseMessage(text: string): ParsedOrderData {
  const bedMatch = text.match(/\b(Bed\s+[A-Za-z0-9-]+|ICU\s+[A-Za-z0-9-]+|Rm\s+[A-Za-z0-9-]+|Room\s+[A-Za-z0-9-]+|\d{3}[A-Z]?)\b/i);
  const bed_number = bedMatch ? (bedMatch[0].toLowerCase().startsWith('bed') ? bedMatch[0] : `Bed ${bedMatch[0]}`) : 'ER Bed';

  const docMatch = text.match(/(?:Dr\.|Doctor|MD)\s*([A-Za-z]+)/i);
  const extractedSender = extractSenderFromRawText(text);
  const ordered_by = docMatch ? `Dr. ${docMatch[1]}` : (extractedSender || 'Telegram Sender');

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

export async function parseTelegramTextClientSide(text: string): Promise<ParsedOrderData> {
  // 1. First attempt to call the backend /api/parse route which has server-side process.env.GEMINI_API_KEY
  try {
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.parsed) {
        return data.parsed;
      }
    }
  } catch (apiErr) {
    console.warn('Backend /api/parse call skipped or failed, trying direct client or fallback:', apiErr);
  }

  // 2. Client-side fallback if VITE_GEMINI_API_KEY is configured
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  const apiKey = metaEnv?.VITE_GEMINI_API_KEY || undefined;
  
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an expert clinical AI parsing hospital rounding Telegram messages into structured order JSON.

Input message text:
"${text}"

Parse and categorize into strict JSON with the following fields:
1. "patient_name": Extract the patient's full name (e.g., "JESSIE PIELAGO"). Look for name headers or uppercase patient names.
2. "age_sex": Extract age and biological sex (e.g. "66 / F", "58 / M").
3. "bed_number": Extract location/bed (e.g. "Port A", "Bed 302", "ICU-04").
4. "case_number": Extract hospital case number (e.g. "CN-5443282", "5443282").
5. "ordered_by": Ordering doctor surname or name (e.g. "Dr. Montalbo", "Dr. Vance").
6. "birthday": Date of birth or "Unspecified".
7. "items": Extract array of individual CLEAN clinical orders, lab tests, medications, or diagnostic requests (e.g., ["Post corr iCa", "Ca", "Alb OD tomorrow (7/30)", "PBS with RC", "Ferritin"]).

CRITICAL RULES:
- DO NOT put greetings ("Hello", "please facilitate for our new admission", "Thank you!"), doctor surnames, patient names, locations, or case numbers inside the "items" array!
- The "items" array MUST ONLY contain actual actionable medical orders and diagnostic tests.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
        ? parsed.items
            .map((i: any) => String(i).trim())
            .filter((i: string) => {
              const lower = i.toLowerCase();
              if (lower.startsWith('hello') || lower.startsWith('please facilitate') || lower.includes('thank you')) return false;
              if (lower.includes('case number') || lower.startsWith('loc:')) return false;
              return i.length > 0;
            })
        : fallback.items;

      return {
        patient_name: parsed.patient_name || fallback.patient_name,
        age_sex: parsed.age_sex || fallback.age_sex,
        birthday: parsed.birthday || fallback.birthday,
        bed_number: parsed.bed_number || fallback.bed_number,
        case_number: parsed.case_number || fallback.case_number,
        ordered_by: parsed.ordered_by || fallback.ordered_by,
        items: parsedItems.length > 0 ? parsedItems : fallback.items,
      };
    } catch (err) {
      console.warn('Client-side Gemini parse failed, using fallback:', err);
    }
  }

  // 3. Fallback regex parser
  return fallbackParseMessage(text);
}

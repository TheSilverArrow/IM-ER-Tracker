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

export function fallbackParseMessage(text: string): ParsedOrderData {
  let bed_number = 'Bed Unassigned';
  const bedMatch = text.match(
    /(?:bed\s*|room\s*|icu\s*-?\s*|ER\s*-?\s*|\b)([0-9]{2,4}[a-zA-Z]?|[0-9]{1,2}-[a-zA-Z]|ICU-[0-9]{1,2})/i
  );
  if (bedMatch && bedMatch[1]) {
    const rawBed = bedMatch[1].toUpperCase();
    bed_number = rawBed.startsWith('BED') || rawBed.startsWith('ICU') ? rawBed : `Bed ${rawBed}`;
  }

  let ordered_by = 'Dr. Rounding';
  const docMatch = text.match(/(?:Dr\.|Doctor)\s*([A-Z][a-z]+)/i);
  if (docMatch && docMatch[1]) {
    ordered_by = `Dr. ${docMatch[1]}`;
  }

  let patient_name = `Patient ${bed_number.replace('Bed ', '')}`;
  const nameMatch = text.match(/(?:Pt|Patient|Name)\.?:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
  if (nameMatch && nameMatch[1]) {
    patient_name = nameMatch[1];
  }

  let age_sex = 'N/A';
  const ageSexMatch = text.match(/\b([0-9]{1,2})\s*\/\s*([MFmf])\b|\b([0-9]{1,2})\s*([MFmf])\b/);
  if (ageSexMatch) {
    const age = ageSexMatch[1] || ageSexMatch[3];
    const sex = (ageSexMatch[2] || ageSexMatch[4]).toUpperCase();
    age_sex = `${age} / ${sex}`;
  }

  let birthday = 'Unspecified';
  const dobMatch = text.match(/(?:DOB|Birth|Bday)\.?:?\s*([0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})/i);
  if (dobMatch && dobMatch[1]) {
    birthday = dobMatch[1];
  }

  const randNum = Math.floor(10000 + Math.random() * 90000);
  const case_number = `CN-${randNum}`;

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

export async function parseTelegramTextClientSide(text: string): Promise<ParsedOrderData> {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  const apiKey = metaEnv?.VITE_GEMINI_API_KEY || undefined;
  
  if (!apiKey) {
    return fallbackParseMessage(text);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
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
    console.warn('Client-side Gemini parse failed, using fallback:', err);
    return fallbackParseMessage(text);
  }
}

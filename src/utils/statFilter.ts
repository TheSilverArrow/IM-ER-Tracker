import { ClinicalOrder } from '../types';

/**
 * Checks if a clinical order contains the urgent "STAT" designation.
 * Checks raw text, patient name, bed, or any order item strings.
 */
export function isStatMessage(order: Partial<ClinicalOrder> | null | undefined): boolean {
  if (!order) return false;

  const rawText = order.raw_text || '';
  const patientName = order.patient_name || '';
  const itemTexts = Array.isArray(order.items)
    ? order.items.map((i) => (typeof i === 'string' ? i : i.item_text || '')).join(' ')
    : '';
  const bed = order.bed_number || '';
  const orderedBy = order.ordered_by || '';

  const combined = `${rawText} ${patientName} ${itemTexts} ${bed} ${orderedBy}`;

  // Strictly match standalone word "STAT" (case-insensitive).
  // Will NOT match "status", "statue", "station", "statistics", etc.
  return /\bSTAT\b/i.test(combined);
}

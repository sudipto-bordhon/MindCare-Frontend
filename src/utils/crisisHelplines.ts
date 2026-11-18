import { CrisisHelpline } from '../types';

export function parseCrisisHelplines(value: unknown): CrisisHelpline[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) return null;

  const helplines: CrisisHelpline[] = [];
  const ids = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const record = item as Record<string, unknown>;
    const id = typeof record.id === 'string' ? record.id.trim() : '';
    const nameEn = typeof record.nameEn === 'string' ? record.nameEn.trim() : '';
    const nameBn = typeof record.nameBn === 'string' ? record.nameBn.trim() : '';
    const descriptionEn = typeof record.descriptionEn === 'string' ? record.descriptionEn.trim() : '';
    const descriptionBn = typeof record.descriptionBn === 'string' ? record.descriptionBn.trim() : '';
    const phone = typeof record.phone === 'string' ? record.phone.trim() : '';
    const phoneDigitCount = phone.replace(/\D/g, '').length;

    if (!/^[\w-]{1,80}$/.test(id) || ids.has(id)
      || (!nameEn && !nameBn) || nameEn.length > 120 || nameBn.length > 120
      || descriptionEn.length > 240 || descriptionBn.length > 240
      || !/^\+?[\d\s()-]{3,30}$/.test(phone) || phoneDigitCount < 3) return null;
    ids.add(id);
    helplines.push({ id, nameEn, nameBn, descriptionEn, descriptionBn, phone });
  }
  return helplines;
}

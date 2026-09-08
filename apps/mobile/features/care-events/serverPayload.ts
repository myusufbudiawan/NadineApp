import { CareEventData, CareEventType } from './types';

// The mobile UI's enum values are capitalized for display (Section 6.8 —
// segmented toggle labels like "Bottle" / "Breastmilk" read directly off
// these values). The backend's care-event schema (services/api/src/domains
// /care-events/schema.ts) is intentionally lowercase, matching the API
// examples in Section 12. Rather than thread a casing convention through
// every screen and the local SQLite copy, this is the single place that
// translates one to the other, applied only to the payload actually sent to
// the server — the local record keeps its display casing untouched.
const enumFieldsByType: Partial<Record<CareEventType, string[]>> = {
  feeding: ['method'],
  diaper: ['diaperType'],
  temperature: ['method'],
};

export function toServerEventData(
  type: CareEventType,
  data: CareEventData,
): Record<string, unknown> {
  const fields = enumFieldsByType[type];
  if (!fields) return { ...data };
  const result: Record<string, unknown> = { ...data };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === 'string') result[field] = value.toLowerCase();
  }
  return result;
}

export type BabySex = 'girl' | 'boy';

export type BabyProfile = {
  id: string;
  name: string;
  sex: BabySex;
  dateOfBirth: string;
  gestationalWeeks: number;
  gestationalDays: number;
  birthWeightKg: number;
  birthLengthCm?: number;
  birthHeadCircumferenceCm?: number;
  fullTermReferenceWeeks: number;
  photoUri?: string;
  // Only set for a profile hydrated from select-baby.tsx (server-mediated
  // multi-baby accounts). Profile edits are owner-only server-side (see
  // baby-profile/routes.ts) — undefined means "this device's own baby",
  // which is always the owner.
  isOwner?: boolean;
};

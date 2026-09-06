export type BabyProfile = {
  id: string;
  name: string;
  dateOfBirth: string;
  gestationalWeeks: number;
  gestationalDays: number;
  birthWeightKg: number;
  birthLengthCm?: number;
  birthHeadCircumferenceCm?: number;
  fullTermReferenceWeeks: number;
  photoUri?: string;
};

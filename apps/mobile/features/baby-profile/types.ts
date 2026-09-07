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
};

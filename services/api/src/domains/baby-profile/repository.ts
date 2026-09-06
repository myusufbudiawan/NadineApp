export type StoredBaby = {
  id: string;
  userId: string;
  name: string;
  dateOfBirth: Date;
  gestationalWeeks: number;
  gestationalDays: number;
  birthWeightKg: number;
  birthLengthCm?: number;
  birthHeadCircumferenceCm?: number;
  fullTermReferenceWeeks: number;
};
export interface BabyRepository {
  list(userId: string): Promise<StoredBaby[]>;
  create(baby: StoredBaby): Promise<StoredBaby>;
  update(id: string, patch: Partial<StoredBaby>): Promise<StoredBaby>;
}

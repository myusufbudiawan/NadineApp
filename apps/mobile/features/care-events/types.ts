export type CareEventType =
  | 'feeding'
  | 'weight'
  | 'diaper'
  | 'sleep'
  | 'temperature'
  | 'medication'
  | 'note';

export type FeedingData = {
  method: 'Bottle' | 'Breastmilk';
  amount: number;
  unit: 'ml' | 'oz';
};

export type WeightData = {
  value: number;
  unit: 'kg' | 'lb';
};

export type DiaperData = {
  diaperType: 'Wet' | 'Dirty' | 'Both' | 'Other';
};

export type SleepData = {
  startAt: string;
  endAt: string;
};

export type TemperatureData = {
  value: number;
  unit: 'C' | 'F';
  method: 'Oral' | 'Axillary' | 'Temporal' | 'Rectal' | 'Other';
};

export type MedicationData = {
  medicationName: string;
  dose: number;
  unit: string;
  scheduledAt: string;
};

export type NoteData = Record<string, never>;

export type CareEventDataFor<T extends CareEventType> = T extends 'feeding'
  ? FeedingData
  : T extends 'weight'
    ? WeightData
    : T extends 'diaper'
      ? DiaperData
      : T extends 'sleep'
        ? SleepData
        : T extends 'temperature'
          ? TemperatureData
          : T extends 'medication'
            ? MedicationData
            : NoteData;

export type CareEventData =
  | FeedingData
  | WeightData
  | DiaperData
  | SleepData
  | TemperatureData
  | MedicationData
  | NoteData;

export type CareEvent<T extends CareEventType = CareEventType> = {
  id: string;
  babyId: string;
  type: T;
  occurredAt: string;
  data: CareEventDataFor<T>;
  notes?: string;
};

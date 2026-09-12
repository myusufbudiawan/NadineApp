import {
  CareEventData,
  CareEventType,
  DiaperData,
  FeedingData,
  KangarooCareData,
  MedicationData,
  SleepData,
  TemperatureData,
  WeightData,
} from './types';

// NEEDS-CLINICAL-REVIEW: plausibility bounds below are engineering placeholders,
// not clinically approved thresholds. They exist only to reject impossible data
// entry (per Section 8.3), never to imply a diagnosis.
export function validateCareEventData(
  type: CareEventType,
  data: CareEventData,
): string | undefined {
  switch (type) {
    case 'feeding': {
      const { amount } = data as FeedingData;
      if (!(amount > 0)) return 'Amount must be greater than 0';
      if (amount > 500) return 'Amount is outside the expected range';
      return undefined;
    }
    case 'weight': {
      const { value, unit } = data as WeightData;
      if (!(value > 0)) return 'Weight must be greater than 0';
      const max = unit === 'kg' ? 25 : 55;
      if (value > max) return 'Weight is outside the expected range';
      return undefined;
    }
    case 'diaper': {
      const { diaperType } = data as DiaperData;
      if (!diaperType) return 'Select a diaper type';
      return undefined;
    }
    case 'sleep': {
      const { startAt, endAt } = data as SleepData;
      if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
        return 'End time must be after start time';
      }
      return undefined;
    }
    case 'temperature': {
      const { value, unit } = data as TemperatureData;
      const [min, max] = unit === 'C' ? [25, 45] : [77, 113];
      if (value < min || value > max) return 'Temperature is outside the expected range';
      return undefined;
    }
    case 'medication': {
      const { medicationName, dose } = data as MedicationData;
      if (!medicationName?.trim()) return 'Medication name is required';
      if (!(dose >= 0)) return 'Dose cannot be negative';
      return undefined;
    }
    case 'kangaroo': {
      const { startAt, endAt } = data as KangarooCareData;
      if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
        return 'End time must be after start time';
      }
      return undefined;
    }
    case 'note':
      return undefined;
    default:
      return undefined;
  }
}

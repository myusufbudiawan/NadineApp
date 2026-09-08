import { BabyProfile } from './types';
export function validateBaby(
  input: Partial<BabyProfile>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.name?.trim()) errors.name = 'Enter your baby’s name.';
  if (input.sex !== 'girl' && input.sex !== 'boy')
    errors.sex = 'Select girl or boy.';
  if (
    !input.dateOfBirth ||
    Number.isNaN(new Date(input.dateOfBirth).valueOf()) ||
    new Date(input.dateOfBirth) > new Date()
  )
    errors.dateOfBirth = 'Enter a date of birth that is not in the future.';
  if (
    !Number.isInteger(input.gestationalWeeks) ||
    (input.gestationalWeeks ?? 0) < 20 ||
    (input.gestationalWeeks ?? 99) > 45
  )
    errors.gestationalWeeks = 'Enter gestational weeks between 20 and 45.';
  if (
    !Number.isInteger(input.gestationalDays) ||
    (input.gestationalDays ?? -1) < 0 ||
    (input.gestationalDays ?? 9) > 6
  )
    errors.gestationalDays = 'Enter gestational days from 0 to 6.';
  if ((input.birthWeightKg ?? 0) <= 0)
    errors.birthWeightKg = 'Enter a positive birth weight.';
  return errors;
}

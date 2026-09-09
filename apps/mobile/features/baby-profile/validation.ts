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
  // Number.isFinite (not a bare `<= 0` comparison) so a blank/unparseable
  // field — which arrives here as NaN — is rejected rather than silently
  // passing (NaN <= 0 is false, so NaN would otherwise slip through).
  if (
    !Number.isFinite(input.birthWeightKg) ||
    (input.birthWeightKg as number) <= 0 ||
    (input.birthWeightKg as number) > 8
  )
    errors.birthWeightKg = 'Enter a birth weight between 0 and 8 kg.';
  if (
    input.birthLengthCm !== undefined &&
    (!Number.isFinite(input.birthLengthCm) || input.birthLengthCm <= 0 || input.birthLengthCm > 70)
  )
    errors.birthLengthCm = 'Enter a birth length between 0 and 70 cm.';
  if (
    input.birthHeadCircumferenceCm !== undefined &&
    (!Number.isFinite(input.birthHeadCircumferenceCm) ||
      input.birthHeadCircumferenceCm <= 0 ||
      input.birthHeadCircumferenceCm > 50)
  )
    errors.birthHeadCircumferenceCm = 'Enter a head circumference between 0 and 50 cm.';
  return errors;
}

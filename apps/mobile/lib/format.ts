// Measurements (weight, temperature, length, head circumference) are entered
// to 2 decimal places (see the steppers' `decimals: 2`), so they're always
// shown to 2 as well — `${value}` would print 2.5 for 2.50 and make a typed
// second decimal look like it was dropped.
export const MEASUREMENT_DECIMALS = 2;

export function formatMeasurement(value: number, decimals = MEASUREMENT_DECIMALS): string {
  return value.toFixed(decimals);
}

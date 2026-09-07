export type GrowthMetric = 'weight' | 'length' | 'headCircumference';

export type GrowthUnit = 'kg' | 'lb' | 'cm' | 'in';

export type GrowthMeasurement = {
  id: string;
  babyId: string;
  metric: GrowthMetric;
  value: number;
  unit: GrowthUnit;
  measuredAt: string;
};

export const growthMetricLabels: Record<GrowthMetric, string> = {
  weight: 'Weight',
  length: 'Length',
  headCircumference: 'Head Circ.',
};

export const growthMetricUnits: Record<GrowthMetric, GrowthUnit> = {
  weight: 'kg',
  length: 'cm',
  headCircumference: 'cm',
};

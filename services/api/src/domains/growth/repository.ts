import { GrowthMetric } from './schema.js';

export type StoredGrowthMeasurement = {
  id: string;
  babyId: string;
  metric: GrowthMetric;
  value: number;
  unit: string;
  measuredAt: Date;
  createdAt: Date;
};

export interface GrowthRepository {
  list(
    babyId: string,
    metric?: GrowthMetric,
    from?: Date,
    to?: Date,
  ): Promise<StoredGrowthMeasurement[]>;
  create(measurement: StoredGrowthMeasurement): Promise<StoredGrowthMeasurement>;
}

export class InMemoryGrowthRepository implements GrowthRepository {
  private measurements = new Map<string, StoredGrowthMeasurement>();

  async list(babyId: string, metric?: GrowthMetric, from?: Date, to?: Date) {
    return [...this.measurements.values()]
      .filter(
        (m) =>
          m.babyId === babyId &&
          (!metric || m.metric === metric) &&
          (!from || m.measuredAt >= from) &&
          (!to || m.measuredAt <= to),
      )
      .sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime());
  }

  async create(measurement: StoredGrowthMeasurement) {
    this.measurements.set(measurement.id, measurement);
    return measurement;
  }
}

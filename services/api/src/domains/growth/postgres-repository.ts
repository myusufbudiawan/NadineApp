import { Pool } from 'pg';
import { GrowthRepository, StoredGrowthMeasurement } from './repository.js';
import { GrowthMetric } from './schema.js';

export class PostgresGrowthRepository implements GrowthRepository {
  constructor(private db: Pool) {}

  async list(babyId: string, metric?: GrowthMetric, from?: Date, to?: Date) {
    const { rows } = await this.db.query(
      `SELECT * FROM growth_measurements
       WHERE baby_id = $1
         AND ($2::text IS NULL OR metric = $2)
         AND ($3::timestamptz IS NULL OR measured_at >= $3)
         AND ($4::timestamptz IS NULL OR measured_at <= $4)
       ORDER BY measured_at ASC`,
      [babyId, metric ?? null, from ?? null, to ?? null],
    );
    return rows.map(toStoredGrowthMeasurement);
  }

  async create(measurement: StoredGrowthMeasurement) {
    await this.db.query(
      `INSERT INTO growth_measurements (id, baby_id, metric, value, unit, measured_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        measurement.id,
        measurement.babyId,
        measurement.metric,
        measurement.value,
        measurement.unit,
        measurement.measuredAt,
        measurement.createdAt,
      ],
    );
    return measurement;
  }
}

function toStoredGrowthMeasurement(row: Record<string, unknown>): StoredGrowthMeasurement {
  return {
    id: row.id as string,
    babyId: row.baby_id as string,
    metric: row.metric as GrowthMetric,
    value: Number(row.value),
    unit: row.unit as string,
    measuredAt: row.measured_at as Date,
    createdAt: row.created_at as Date,
  };
}

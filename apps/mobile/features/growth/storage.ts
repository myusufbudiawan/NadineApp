import * as Crypto from 'expo-crypto';
import {
  GrowthMeasurementRow,
  insertGrowthMeasurement,
  listGrowthMeasurements,
  queueMutation,
} from '@/lib/offline/database';
import { loadCareEventHistory } from '@/features/care-events/storage';
import { WeightData } from '@/features/care-events/types';
import { GrowthMeasurement, GrowthMetric, GrowthUnit } from './types';
import { validateGrowthMeasurement } from './validation';

export type SaveGrowthMeasurementInput = {
  babyId: string;
  metric: GrowthMetric;
  value: number;
  unit: GrowthUnit;
  measuredAt: Date;
};

function fromRow(row: GrowthMeasurementRow): GrowthMeasurement {
  return {
    id: row.id,
    babyId: row.baby_id,
    metric: row.metric as GrowthMetric,
    value: row.value,
    unit: row.unit as GrowthUnit,
    measuredAt: row.measured_at,
  };
}

// Local-first save, mirroring care-events (Section 1.3): lands in local SQLite
// immediately so the Growth screen can reflect it before any sync round trip,
// with a queued mutation for the Phase 5 sync engine.
export async function saveGrowthMeasurement(
  input: SaveGrowthMeasurementInput,
): Promise<string> {
  const error = validateGrowthMeasurement(input.metric, input.value, input.unit);
  if (error) throw new Error(error);

  const id = Crypto.randomUUID();
  const measuredAt = input.measuredAt.toISOString();

  await insertGrowthMeasurement({
    id,
    babyId: input.babyId,
    metric: input.metric,
    value: input.value,
    unit: input.unit,
    measuredAt,
  });

  await queueMutation(
    Crypto.randomUUID(),
    'growth-measurement',
    JSON.stringify({
      babyId: input.babyId,
      metric: input.metric,
      value: input.value,
      unit: input.unit,
      measuredAt,
      // Server dedups/reconciles cross-device pulls on this, not the
      // server-assigned row id (see lib/offline/hydrate.ts) — must equal
      // this row's local id so a later pull recognizes it as already-local.
      idempotencyKey: id,
    }),
  );

  return id;
}

export async function loadGrowthMeasurements(
  babyId: string,
  metric: GrowthMetric,
): Promise<GrowthMeasurement[]> {
  const rows = await listGrowthMeasurements(babyId, metric);
  return rows.map(fromRow);
}

// Weight already has its own capture point (Track > Add Weight, Section 1.4);
// the Growth screen reads that history directly instead of asking caregivers
// to log the same value twice (Section 2.2 — "weight can source from
// WeightEvent"). Length and head circumference have no other entry point yet,
// so they read from the dedicated growth_measurements store.
export async function loadMeasurementsForMetric(
  babyId: string,
  metric: GrowthMetric,
): Promise<GrowthMeasurement[]> {
  if (metric === 'weight') {
    const events = await loadCareEventHistory(babyId, 'weight');
    return events
      .map((event) => {
        const data = event.data as WeightData;
        return {
          id: event.id,
          babyId: event.babyId,
          metric: 'weight' as const,
          value: data.value,
          unit: data.unit,
          measuredAt: event.occurredAt,
        };
      })
      .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
  }
  return loadGrowthMeasurements(babyId, metric);
}

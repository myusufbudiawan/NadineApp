import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/service.js';
import { BabyProfileService } from '../baby-profile/service.js';
import { CareEventsService } from '../care-events/service.js';
import { GrowthService } from '../growth/service.js';
import { actualAge, correctedAge } from '../../common/util/age.js';
import { ReportCategory, ReportInput } from './schema.js';

const actorId = 'development-user';

export type ReportResult = {
  babyId: string;
  generatedAt: Date;
  dateRange: { from: Date; to: Date };
  babyProfile: {
    name: string;
    dateOfBirth: Date;
    gestationalWeeks: number;
    gestationalDays: number;
    birthWeightKg: number;
    birthLengthCm?: number;
    birthHeadCircumferenceCm?: number;
  };
  ageContext: {
    actualAge: { weeks: number; days: number; totalDays: number };
    correctedAge: { weeks: number; days: number; totalDays: number };
    fullTermReferenceWeeks: number;
  };
  careEventSummary: Array<{
    type: string;
    count: number;
    events: Array<{
      id: string;
      occurredAt: Date;
      dataSource: 'caregiver-entered' | 'device';
      notes?: string;
    }>;
  }>;
  measurements: Array<{
    id: string;
    metric: string;
    value: number;
    unit: string;
    measuredAt: Date;
  }>;
};

const careEventCategoryList = [
  'feeding',
  'weight',
  'diaper',
  'sleep',
  'temperature',
  'medication',
  'note',
] as const;

/**
 * Cross-domain reads go through each domain's own service (Constitution
 * 0.A #3) — this class never touches another domain's repository directly.
 * Nothing generated here is persisted (Section 7: Report is not a stored
 * entity), so sharing the resulting file is inherently a one-time action —
 * it cannot itself create a standing ShareGrant (FR-015 acceptance).
 */
export class ReportsService {
  constructor(
    private babyProfile: BabyProfileService,
    private careEvents: CareEventsService,
    private growth: GrowthService,
    private audit: AuditService,
  ) {}

  async generate(babyId: string, input: ReportInput): Promise<ReportResult> {
    const baby = await this.babyProfile.get(babyId);
    if (!baby) throw new Error('Baby not found');

    const categories = input.categories ?? ([...careEventCategoryList, 'growth'] as ReportCategory[]);
    const now = new Date();

    const allEvents = await this.careEvents.list(babyId);
    const eventsInRange = allEvents.filter(
      (e) =>
        e.occurredAt >= input.from &&
        e.occurredAt <= input.to &&
        categories.includes(e.type as ReportCategory),
    );
    const byType = new Map<string, typeof eventsInRange>();
    for (const event of eventsInRange) {
      const bucket = byType.get(event.type) ?? [];
      bucket.push(event);
      byType.set(event.type, bucket);
    }
    const careEventSummary = [...byType.entries()].map(([type, events]) => ({
      type,
      count: events.length,
      events: events.map((e) => ({
        id: e.id,
        occurredAt: e.occurredAt,
        // Caregiver-entered unless the event explicitly records a verified
        // device source (Section 4.2 requirement) — weight is the only type
        // that currently carries measurementSource.
        dataSource:
          (e.data as { measurementSource?: string }).measurementSource === 'device'
            ? ('device' as const)
            : ('caregiver-entered' as const),
        notes: e.notes,
      })),
    }));

    const measurements = categories.includes('growth')
      ? (await this.growth.list(babyId, undefined, input.from, input.to)).map((m) => ({
          id: m.id,
          metric: m.metric,
          value: m.value,
          unit: m.unit,
          measuredAt: m.measuredAt,
        }))
      : [];

    const result: ReportResult = {
      babyId,
      generatedAt: now,
      dateRange: { from: input.from, to: input.to },
      babyProfile: {
        name: baby.name,
        dateOfBirth: baby.dateOfBirth,
        gestationalWeeks: baby.gestationalWeeks,
        gestationalDays: baby.gestationalDays,
        birthWeightKg: baby.birthWeightKg,
        birthLengthCm: baby.birthLengthCm,
        birthHeadCircumferenceCm: baby.birthHeadCircumferenceCm,
      },
      ageContext: {
        actualAge: actualAge(baby.dateOfBirth, now),
        correctedAge: correctedAge(
          baby.dateOfBirth,
          baby.gestationalWeeks,
          baby.gestationalDays,
          baby.fullTermReferenceWeeks,
          now,
        ),
        fullTermReferenceWeeks: baby.fullTermReferenceWeeks,
      },
      careEventSummary,
      measurements,
    };

    // Report generation itself is not a mutation of a sensitive record, but
    // it does expose the baby's full history to whoever requested it — worth
    // an audit trail entry (FR-019 spirit: track access to sensitive data).
    await this.audit.record({
      actorId,
      babyId,
      action: 'create',
      entityType: 'report',
      entityId: randomUUID(),
    });

    return result;
  }

  toCsv(report: ReportResult): string {
    const lines: string[] = [];
    lines.push('section,type,id,timestamp,value,unit,notes');
    for (const group of report.careEventSummary) {
      for (const event of group.events) {
        lines.push(
          [
            'care_event',
            group.type,
            event.id,
            event.occurredAt.toISOString(),
            '',
            '',
            csvEscape(event.notes ?? ''),
          ].join(','),
        );
      }
    }
    for (const m of report.measurements) {
      lines.push(
        ['growth', m.metric, m.id, m.measuredAt.toISOString(), String(m.value), m.unit, ''].join(
          ',',
        ),
      );
    }
    return lines.join('\n');
  }
}

function csvEscape(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

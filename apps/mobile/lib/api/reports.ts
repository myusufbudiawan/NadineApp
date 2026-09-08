import { apiFetch } from './client';

export type ReportCategory =
  | 'feeding'
  | 'weight'
  | 'diaper'
  | 'sleep'
  | 'temperature'
  | 'medication'
  | 'note'
  | 'growth';

type Age = { weeks: number; days: number; totalDays: number };

export type ReportResult = {
  babyId: string;
  generatedAt: string;
  dateRange: { from: string; to: string };
  babyProfile: {
    name: string;
    dateOfBirth: string;
    gestationalWeeks: number;
    gestationalDays: number;
    birthWeightKg: number;
    birthLengthCm?: number;
    birthHeadCircumferenceCm?: number;
  };
  ageContext: {
    actualAge: Age;
    correctedAge: Age;
    fullTermReferenceWeeks: number;
  };
  careEventSummary: Array<{
    type: string;
    count: number;
    events: Array<{
      id: string;
      occurredAt: string;
      dataSource: 'caregiver-entered' | 'device';
      notes?: string;
    }>;
  }>;
  measurements: Array<{
    id: string;
    metric: string;
    value: number;
    unit: string;
    measuredAt: string;
  }>;
};

export type GenerateReportInput = {
  from: Date;
  to: Date;
  categories?: ReportCategory[];
};

export const generateReport = (babyId: string, input: GenerateReportInput) =>
  apiFetch<ReportResult>(`/v1/babies/${babyId}/reports`, {
    method: 'POST',
    body: JSON.stringify({
      from: input.from.toISOString(),
      to: input.to.toISOString(),
      categories: input.categories,
      format: 'json',
    }),
  });

// Sharing this file is a one-time export — generating it never creates a
// standing ShareGrant (Section 15: no ongoing access from a one-time share).
export const generateReportCsv = (babyId: string, input: GenerateReportInput) =>
  apiFetch<string>(`/v1/babies/${babyId}/reports`, {
    method: 'POST',
    body: JSON.stringify({
      from: input.from.toISOString(),
      to: input.to.toISOString(),
      categories: input.categories,
      format: 'csv',
    }),
  });

import { z } from 'zod';

export const tipCategories = [
  'feeding',
  'growth',
  'sleep',
  'daily-care',
  'kangaroo-care',
  'emotional-support',
] as const;
export type TipCategory = (typeof tipCategories)[number];

export const reviewStatuses = ['draft', 'needs-clinical-review', 'approved'] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

// A tip only reaches a caregiver's device once reviewStatus is 'approved'
// (ContentService.list filters on this) — see Section 15 "no unconfigurable
// clinical constants" / Section 0.A #5 NEEDS-CLINICAL-REVIEW gating.
export const tipSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  category: z.enum(tipCategories),
  // Corrected-age-in-days bounds this tip is eligible for; omit either side
  // for "no lower/upper bound". Negative values are valid (preterm babies
  // have negative corrected age until their due date — see lib/age.ts on
  // the mobile side for the same convention).
  minCorrectedAgeDays: z.number().int().optional(),
  maxCorrectedAgeDays: z.number().int().optional(),
  source: z.string().min(1),
  reviewStatus: z.enum(reviewStatuses).default('needs-clinical-review'),
});

export type TipInput = z.infer<typeof tipSchema>;

import { z } from 'zod';
import { careEventTypes } from '../care-events/schema.js';

const reportCategories = [...careEventTypes, 'growth'] as const;

export const reportSchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
    categories: z.array(z.enum(reportCategories)).optional(),
    format: z.enum(['json', 'csv']).default('json'),
  })
  .refine((d) => d.to >= d.from, { message: 'to must be on or after from' });

export type ReportInput = z.infer<typeof reportSchema>;
export type ReportCategory = (typeof reportCategories)[number];

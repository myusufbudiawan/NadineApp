import { z } from 'zod';
export const tipSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  reviewStatus: z.enum(['draft', 'needs-clinical-review', 'approved']),
});

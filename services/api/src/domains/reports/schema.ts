import { z } from 'zod';
export const reportSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

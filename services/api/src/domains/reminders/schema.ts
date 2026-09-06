import { z } from 'zod';
export const reminderSchema = z.object({
  title: z.string().min(1),
  scheduledFor: z.coerce.date(),
});

import { z } from 'zod';
export const shareSchema = z.object({
  recipientEmail: z.string().email(),
  permission: z.enum(['read', 'write']),
});

import { z } from 'zod';
export const sessionSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  refreshToken: z.string().optional(),
});

export const deletionRequestSchema = z.object({
  reason: z.string().max(500).optional(),
});

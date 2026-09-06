import { z } from 'zod';
export const syncSchema = z.object({
  mutations: z.array(
    z.object({ id: z.string().uuid(), type: z.string(), payload: z.unknown() }),
  ),
});

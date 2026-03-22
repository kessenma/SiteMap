import { z } from 'zod';

export const facilitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Facility = z.infer<typeof facilitySchema>;

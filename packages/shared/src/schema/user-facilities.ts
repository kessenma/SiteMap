import { z } from 'zod';

export const userFacilitySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  facility_id: z.string().uuid(),
  created_at: z.string(),
});

export type UserFacility = z.infer<typeof userFacilitySchema>;

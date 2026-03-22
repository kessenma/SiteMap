import { z } from 'zod';
import { teammateRoleEnum } from './enums';

export const teammateSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  teammate_id: z.string(),
  role: teammateRoleEnum,
  created_at: z.string(),
  updated_at: z.string(),
});

export type Teammate = z.infer<typeof teammateSchema>;

import { z } from 'zod';
import { userRoleEnum } from './enums';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: userRoleEnum,
  email_verified: z.boolean(),
  image: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type User = z.infer<typeof userSchema>;

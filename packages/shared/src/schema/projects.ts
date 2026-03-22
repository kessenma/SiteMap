import { z } from 'zod';

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  address: z.string(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Project = z.infer<typeof projectSchema>;

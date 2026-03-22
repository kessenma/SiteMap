import { z } from 'zod';

export const mapListSchema = z.object({
  id: z.string().uuid(),
  map_id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MapList = z.infer<typeof mapListSchema>;

import { z } from 'zod';

export const mapPathSchema = z.object({
  id: z.string().uuid(),
  map_id: z.string().uuid(),
  label: z.string(),
  color: z.string(),
  stroke_width: z.number(),
  path_data: z.string(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MapPath = z.infer<typeof mapPathSchema>;

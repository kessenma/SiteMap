import { z } from 'zod';

export const mapCommentSchema = z.object({
  id: z.string().uuid(),
  map_id: z.string().uuid(),
  x: z.number(),
  y: z.number(),
  content: z.string(),
  created_by: z.string().uuid().nullable(),
  resolved_at: z.string().nullable(),
  resolved_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MapComment = z.infer<typeof mapCommentSchema>;

import { z } from 'zod';

export const markerPhotoSchema = z.object({
  id: z.string().uuid(),
  marker_id: z.string().uuid(),
  file_uri: z.string(),
  file_name: z.string(),
  file_size: z.number().int(),
  caption: z.string(),
  taken_at: z.string(),
  created_at: z.string(),
});

export type MarkerPhoto = z.infer<typeof markerPhotoSchema>;

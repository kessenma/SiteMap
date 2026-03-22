import { z } from 'zod';
import { markerStatusEnum } from './enums';

export const mapMarkerSchema = z.object({
  id: z.string().uuid(),
  map_id: z.string().uuid(),
  key_id: z.string().uuid(),
  x: z.number(),
  y: z.number(),
  label: z.string(),
  description: z.string(),
  status: markerStatusEnum,
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MapMarker = z.infer<typeof mapMarkerSchema>;

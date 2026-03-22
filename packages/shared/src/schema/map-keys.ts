import { z } from 'zod';
import { iconShapeEnum, iconTypeEnum, markerSizeEnum } from './enums';

export const mapKeySchema = z.object({
  id: z.string().uuid(),
  map_id: z.string().uuid(),
  label: z.string(),
  icon_name: z.string(),
  icon_color: z.string(),
  icon_shape: iconShapeEnum,
  icon_type: iconTypeEnum,
  icon_text: z.string().nullable(),
  custom_icon_uri: z.string().nullable(),
  marker_size: markerSizeEnum,
  sort_order: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MapKey = z.infer<typeof mapKeySchema>;

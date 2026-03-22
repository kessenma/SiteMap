import { z } from 'zod';
import { listItemStatusEnum } from './enums';

export const mapListItemSchema = z.object({
  id: z.string().uuid(),
  list_id: z.string().uuid(),
  x: z.number(),
  y: z.number(),
  label: z.string(),
  description: z.string(),
  sort_order: z.number().int(),
  status: listItemStatusEnum,
  completed_by: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MapListItem = z.infer<typeof mapListItemSchema>;

import { z } from 'zod';

export const listItemPhotoSchema = z.object({
  id: z.string().uuid(),
  list_item_id: z.string().uuid(),
  file_uri: z.string(),
  file_name: z.string(),
  file_size: z.number().int(),
  caption: z.string(),
  created_at: z.string(),
});

export type ListItemPhoto = z.infer<typeof listItemPhotoSchema>;

import { z } from 'zod';

export const commentPhotoSchema = z.object({
  id: z.string().uuid(),
  comment_id: z.string().uuid(),
  file_uri: z.string(),
  file_name: z.string(),
  file_size: z.number().int(),
  created_at: z.string(),
});

export type CommentPhoto = z.infer<typeof commentPhotoSchema>;

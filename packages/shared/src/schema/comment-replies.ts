import { z } from 'zod';

export const commentReplySchema = z.object({
  id: z.string().uuid(),
  comment_id: z.string().uuid(),
  content: z.string(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CommentReply = z.infer<typeof commentReplySchema>;

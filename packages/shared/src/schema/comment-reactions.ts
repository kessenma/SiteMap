import { z } from 'zod';
import { reactionEmojiEnum } from './enums';

export const commentReactionSchema = z.object({
  id: z.string().uuid(),
  comment_id: z.string().uuid(),
  user_id: z.string(),
  emoji: reactionEmojiEnum,
  created_at: z.string(),
});

export type CommentReaction = z.infer<typeof commentReactionSchema>;

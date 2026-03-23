import { z } from 'zod';

export const userRoleEnum = z.enum(['admin', 'operator', 'technician']);
export type UserRole = z.infer<typeof userRoleEnum>;

export const markerStatusEnum = z.enum(['active', 'resolved', 'flagged']);
export type MarkerStatus = z.infer<typeof markerStatusEnum>;

export const iconShapeEnum = z.enum(['circle', 'square', 'triangle', 'diamond']);
export type IconShape = z.infer<typeof iconShapeEnum>;

export const fileTypeEnum = z.enum(['pdf', 'image']);
export type FileType = z.infer<typeof fileTypeEnum>;

export const teammateRoleEnum = z.enum(['team_member', 'manager']);
export type TeammateRole = z.infer<typeof teammateRoleEnum>;

export const iconTypeEnum = z.enum(['shape', 'image', 'drawn', 'text', 'lucide']);
export type IconType = z.infer<typeof iconTypeEnum>;

export const markerSizeEnum = z.enum(['sm', 'md', 'lg', 'xl']);
export type MarkerSize = z.infer<typeof markerSizeEnum>;

export const reactionEmojiEnum = z.enum(['thumbs_up', 'thumbs_down', 'heart', 'laugh', 'fire', 'eyes']);
export type ReactionEmoji = z.infer<typeof reactionEmojiEnum>;

export const listItemStatusEnum = z.enum(['pending', 'in_progress', 'completed']);
export type ListItemStatus = z.infer<typeof listItemStatusEnum>;

export const serviceRequestStatusEnum = z.enum(['open', 'in_progress', 'resolved', 'closed']);
export type ServiceRequestStatus = z.infer<typeof serviceRequestStatusEnum>;

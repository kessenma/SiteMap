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

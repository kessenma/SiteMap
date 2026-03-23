import { z } from 'zod';
import { serviceRequestStatusEnum } from './enums';

export const serviceRequestSchema = z.object({
  id: z.string().uuid(),
  map_id: z.string().uuid(),
  x: z.number(),
  y: z.number(),
  category: z.string(),
  description: z.string(),
  status: serviceRequestStatusEnum,
  created_by: z.string().uuid().nullable(),
  resolved_by: z.string().uuid().nullable(),
  resolved_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ServiceRequest = z.infer<typeof serviceRequestSchema>;

export const serviceRequestPhotoSchema = z.object({
  id: z.string().uuid(),
  service_request_id: z.string().uuid(),
  file_uri: z.string(),
  file_name: z.string(),
  file_size: z.number().int(),
  created_at: z.string(),
});

export type ServiceRequestPhoto = z.infer<typeof serviceRequestPhotoSchema>;

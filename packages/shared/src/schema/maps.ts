import { z } from 'zod';
import { fileTypeEnum } from './enums';

export const mapSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid().nullable(),
  facility_id: z.string().uuid().nullable(),
  name: z.string(),
  description: z.string(),
  file_type: fileTypeEnum,
  file_uri: z.string(),
  file_name: z.string(),
  file_size: z.number().int(),
  width: z.number(),
  height: z.number(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type SiteMap = z.infer<typeof mapSchema>;

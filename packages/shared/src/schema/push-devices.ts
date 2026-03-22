import { z } from 'zod';

export const devicePlatformEnum = z.enum(['ios', 'android']);
export type DevicePlatform = z.infer<typeof devicePlatformEnum>;

export const deviceEnvironmentEnum = z.enum(['dev', 'prod']);
export type DeviceEnvironment = z.infer<typeof deviceEnvironmentEnum>;

export const pushDeviceSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  platform: devicePlatformEnum,
  token: z.string(),
  environment: deviceEnvironmentEnum,
  is_active: z.boolean(),
  last_seen_at: z.string(),
  device_id: z.string().nullable(),
  device_model: z.string().nullable(),
  app_version: z.string().nullable(),
  build_number: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PushDevice = z.infer<typeof pushDeviceSchema>;

import { z } from 'zod';
import { userRoleEnum } from '../schema/enums';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    role: userRoleEnum,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const USER_ROLE_OPTIONS = [
  {
    value: 'admin' as const,
    label: 'Admin',
    description: 'Full access to manage users, projects, and settings',
    icon: 'Shield',
  },
  {
    value: 'operator' as const,
    label: 'Operator',
    description: 'Manage equipment, view maps, field operations',
    icon: 'Settings',
  },
  {
    value: 'technician' as const,
    label: 'Technician',
    description: 'View and update maps, markers, and field data',
    icon: 'Wrench',
  },
] as const;

export const TOTP_CONFIG = {
  issuer: 'SiteMap',
  digits: 6,
  period: 30,
} as const;

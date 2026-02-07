import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    fullName: z.string().min(1, 'Full name is required'),
    role: z.enum(['client', 'attorney', 'admin'], {
      error: 'Please select a role',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const profileUpdateSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').nullable(),
  fullName: z.string().min(1, 'Full name is required').nullable(),
  website: z.string().url('Please enter a valid URL').nullable().or(z.literal('')),
});

export const attorneyProfileSchema = z.object({
  barNumber: z.string().min(1, 'Bar number is required'),
  barState: z.string().min(1, 'Bar state is required'),
  practiceAreas: z.array(z.string()).min(1, 'Select at least one practice area'),
  yearsOfExperience: z.number().int().min(0, 'Must be 0 or more').nullable(),
  bio: z.string().max(1000, 'Bio must be 1000 characters or less').nullable(),
  hourlyRate: z.number().min(0, 'Must be 0 or more').nullable(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type AttorneyProfileFormData = z.infer<typeof attorneyProfileSchema>;

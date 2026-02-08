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

// Request creation schemas — per-step + full form
export const requestPracticeAreaSchema = z.object({
  practiceArea: z.string().min(1, 'Please select a practice area'),
});

export const requestDetailsSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(120, 'Title must be 120 characters or less'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000, 'Description must be 5000 characters or less'),
});

export const requestLocationSchema = z.object({
  state: z.string().nullable(),
  city: z.string().max(100, 'City must be 100 characters or less').nullable(),
});

export const requestBudgetSchema = z.object({
  budgetMin: z.number().min(0, 'Budget must be 0 or more').nullable(),
  budgetMax: z.number().min(0, 'Budget must be 0 or more').nullable(),
  urgency: z.enum(['low', 'normal', 'high', 'urgent']),
});

export const requestCreateSchema = requestPracticeAreaSchema
  .merge(requestDetailsSchema)
  .merge(requestLocationSchema)
  .merge(requestBudgetSchema)
  .refine(
    (data) => {
      if (data.budgetMin != null && data.budgetMax != null) {
        return data.budgetMax >= data.budgetMin;
      }
      return true;
    },
    { message: 'Maximum budget must be greater than or equal to minimum', path: ['budgetMax'] },
  );

// Quote creation schema
export const quoteCreateSchema = z
  .object({
    pricingType: z.enum(['flat_fee', 'hourly', 'retainer', 'contingency'], {
      error: 'Please select a pricing type',
    }),
    feeAmount: z.number().min(1, 'Fee amount is required'),
    estimatedHours: z.number().min(0.5, 'Must be at least 0.5 hours').nullable(),
    scopeOfWork: z.string().min(20, 'Scope must be at least 20 characters').max(5000, 'Scope must be 5000 characters or less'),
    estimatedTimeline: z.string().max(200, 'Timeline must be 200 characters or less').nullable(),
    terms: z.string().max(5000, 'Terms must be 5000 characters or less').nullable(),
    validUntilDays: z.number().min(1, 'Please select a validity period'),
  })
  .refine(
    (data) => {
      if (data.pricingType === 'hourly' && (data.estimatedHours == null || data.estimatedHours <= 0)) {
        return false;
      }
      return true;
    },
    { message: 'Estimated hours is required for hourly pricing', path: ['estimatedHours'] },
  );

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type AttorneyProfileFormData = z.infer<typeof attorneyProfileSchema>;
export type RequestCreateFormData = z.infer<typeof requestCreateSchema>;
export type QuoteCreateFormData = z.infer<typeof quoteCreateSchema>;

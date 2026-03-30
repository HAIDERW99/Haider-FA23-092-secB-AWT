import { z } from 'zod'

// User schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['client', 'moderator', 'admin', 'super_admin']).default('client')
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

// Ad schemas
export const createAdSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(2000, 'Description must be less than 2000 characters'),
  category_id: z.string().uuid('Invalid category ID'),
  city_id: z.string().uuid('Invalid city ID'),
  package_id: z.string().uuid('Invalid package ID'),
  media_urls: z.array(z.string().url('Invalid URL')).min(1, 'At least one media URL is required').max(5, 'Maximum 5 media URLs allowed')
})

export const updateAdSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title must be less than 100 characters').optional(),
  description: z.string().min(50, 'Description must be at least 50 characters').max(2000, 'Description must be less than 2000 characters').optional(),
  category_id: z.string().uuid('Invalid category ID').optional(),
  city_id: z.string().uuid('Invalid city ID').optional(),
  media_urls: z.array(z.string().url('Invalid URL')).min(1, 'At least one media URL is required').max(5, 'Maximum 5 media URLs allowed').optional()
})

export const adQuerySchema = z.object({
  category: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'rank']).default('rank'),
  page: z.string().transform(Number).pipe(z.number().min(1)).default(1),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default(12)
})

// Payment schemas
export const createPaymentSchema = z.object({
  ad_id: z.string().uuid('Invalid ad ID'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  method: z.string().min(1, 'Payment method is required'),
  transaction_ref: z.string().min(1, 'Transaction reference is required').regex(/^[a-zA-Z0-9]+$/, 'Transaction reference must be alphanumeric only'),
  sender_name: z.string().min(2, 'Sender name must be at least 2 characters'),
  screenshot_url: z.string().url('Invalid screenshot URL')
})

export const verifyPaymentSchema = z.object({
  status: z.enum(['verified', 'rejected']),
  note: z.string().optional()
})

// Review schemas
export const reviewAdSchema = z.object({
  status: z.enum(['under_review', 'rejected', 'payment_pending']),
  note: z.string().optional()
})

// Admin schemas
export const publishAdSchema = z.object({
  publish_at: z.string().datetime().optional(),
  admin_boost: z.number().min(0).max(100).optional()
})

// Package schemas
export const packageQuerySchema = z.object({
  featured: z.string().transform(val => val === 'true').optional()
})

// Learning question schemas
export const questionQuerySchema = z.object({
  topic: z.string().optional(),
  difficulty: z.string().optional()
})

// API response schema
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional()
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number()
})

// Export types
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateAdInput = z.infer<typeof createAdSchema>
export type UpdateAdInput = z.infer<typeof updateAdSchema>
export type AdQueryInput = z.infer<typeof adQuerySchema>
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>
export type ReviewAdInput = z.infer<typeof reviewAdSchema>
export type PublishAdInput = z.infer<typeof publishAdSchema>
export type PackageQueryInput = z.infer<typeof packageQuerySchema>
export type QuestionQueryInput = z.infer<typeof questionQuerySchema>
export type ApiResponse = z.infer<typeof apiResponseSchema>
export type Pagination = z.infer<typeof paginationSchema>

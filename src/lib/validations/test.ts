import { z } from "zod";

export const testMetadataSchema = z.object({
  testId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  instructions: z.string().max(5000).optional().nullable(),
  duration_minutes: z
    .union([z.coerce.number().int().min(1).max(600), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v === null || v === undefined ? null : v)),
  starts_at: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v : null)),
  ends_at: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v : null)),
});

export const createTestSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
});

export const mcqQuestionSchema = z.object({
  testId: z.string().uuid(),
  questionId: z.string().uuid().optional(),
  question_text: z.string().min(1, "Question text is required"),
  marks: z.coerce.number().min(0.5).max(100),
  options: z
    .array(z.string().min(1))
    .min(2, "At least two options")
    .max(8),
  correct_option: z.string().min(1, "Select the correct option"),
  explanation: z.string().max(2000).optional().nullable(),
});

export const numericQuestionSchema = z.object({
  testId: z.string().uuid(),
  questionId: z.string().uuid().optional(),
  question_text: z.string().min(1, "Question text is required"),
  marks: z.coerce.number().min(0.5).max(100),
  correct_value: z.coerce.number(),
  numeric_tolerance: z
    .union([z.coerce.number().min(0), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v === null || v === undefined ? null : v)),
  explanation: z.string().max(2000).optional().nullable(),
});

export const deleteQuestionSchema = z.object({
  testId: z.string().uuid(),
  questionId: z.string().uuid(),
});

export const publishTestSchema = z.object({
  testId: z.string().uuid(),
  sendEmails: z.boolean().optional().default(true),
});

export const archiveTestSchema = z.object({
  testId: z.string().uuid(),
});

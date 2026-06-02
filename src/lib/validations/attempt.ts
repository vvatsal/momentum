import { z } from "zod";

export const saveAnswerSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  status: z.enum(["answered", "skipped", "unanswered"]),
  selectedOption: z.string().nullable().optional(), // Will store JSON string for MSQ
  numericAnswer: z.number().nullable().optional(),
});

export const saveTimingSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  deltaSeconds: z.number().int().min(0).max(36000),
});

export const visitQuestionSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
});

export const finalSubmitSchema = z.object({
  attemptId: z.string().uuid(),
});

export const syncNavigationSchema = z.object({
  attemptId: z.string().uuid(),
  leaveQuestionId: z.string().uuid(),
  enterQuestionId: z.string().uuid(),
  leaveTimeDelta: z.number().int().min(0).max(36000),
  leaveAnswer: z
    .object({
      status: z.enum(["answered", "skipped", "unanswered"]),
      selectedOption: z.string().nullable().optional(),
      numericAnswer: z.number().nullable().optional(),
    })
    .optional(),
});

export const flushTimingSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  deltaSeconds: z.number().int().min(0).max(36000),
});

export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
export type SaveTimingInput = z.infer<typeof saveTimingSchema>;

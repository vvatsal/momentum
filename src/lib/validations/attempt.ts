import { z } from "zod";

export const saveAnswerSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  status: z.enum(["answered", "skipped", "unanswered"]),
  selectedOption: z.string().nullable().optional(),
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

export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
export type SaveTimingInput = z.infer<typeof saveTimingSchema>;

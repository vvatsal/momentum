"use server";

import { createClient } from "@/lib/supabase/server";
import { bulkQuestionsSchema } from "@/lib/validations/test";
import { saveBulkQuestions } from "./test";

export async function generateAiQuestions(input: {
    testId: string;
    prompt: string;
    count: number;
}) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return { ok: false, error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file." };
    }

    const systemPrompt = `You are an expert exam creator. Generate ${input.count} questions for a test based on the provided topic or text.
Return the result as a JSON object with a "questions" array.
Each question must follow this structure:
For MCQ: { "type": "mcq", "question_text": "...", "marks": 1, "options": ["A", "B", "C", "D"], "correct_option": "A", "explanation": "..." }
For Numeric: { "type": "numeric", "question_text": "...", "marks": 1, "correct_value": 42, "numeric_tolerance": 0.01, "explanation": "..." }

Ensure the output is valid JSON and matches the schema exactly.`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: input.prompt },
                ],
                response_format: { type: "json_object" },
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            return { ok: false, error: err.error?.message || "Failed to call AI API" };
        }

        const result = await response.json();
        const content = JSON.parse(result.choices[0].message.content);

        // Validate with existing bulk schema
        const validated = bulkQuestionsSchema.safeParse({
            testId: input.testId,
            questions: content.questions,
        });

        if (!validated.success) {
            console.error("AI Validation Error:", validated.error);
            return { ok: false, error: "AI generated invalid question format. Please try again." };
        }

        // Save the generated questions
        return await saveBulkQuestions(validated.data);
    } catch (err: any) {
        return { ok: false, error: err.message || "An unexpected error occurred" };
    }
}

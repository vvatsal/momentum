import type {
  McqCorrectAnswer,
  NumericCorrectAnswer,
  Question,
  QuestionType,
} from "@/types/database";

export function scoreResponse(
  question: Pick<
    Question,
    "type" | "correct_answer" | "numeric_tolerance" | "marks"
  >,
  selectedOption: string | null,
  numericAnswer: number | null
): { isCorrect: boolean; awardedMarks: number } {
  const marks = Number(question.marks);

  if (question.type === "mcq") {
    const correct = question.correct_answer as McqCorrectAnswer;
    const correctOptions = correct.options || [];

    // Handle both single string (legacy) and array (new) for selectedOption
    let selected: string[] = [];
    if (selectedOption) {
      try {
        // Try parsing as JSON array
        const parsed = JSON.parse(selectedOption);
        if (Array.isArray(parsed)) selected = parsed;
        else selected = [selectedOption];
      } catch {
        // Fallback to single string
        selected = [selectedOption];
      }
    }

    const isCorrect =
      selected.length === correctOptions.length &&
      selected.every((opt) => correctOptions.includes(opt)) &&
      correctOptions.every((opt) => selected.includes(opt));

    return { isCorrect, awardedMarks: isCorrect ? marks : 0 };
  }

  if (numericAnswer === null || Number.isNaN(numericAnswer)) {
    return { isCorrect: false, awardedMarks: 0 };
  }

  const correct = question.correct_answer as NumericCorrectAnswer;
  const expected = Number(correct.value);
  const tolerance =
    question.numeric_tolerance != null
      ? Number(question.numeric_tolerance)
      : 0;

  const isCorrect =
    tolerance > 0
      ? Math.abs(numericAnswer - expected) <= tolerance
      : numericAnswer === expected;

  return { isCorrect, awardedMarks: isCorrect ? marks : 0 };
}

export function parseNumericInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function isValidNumericInput(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  return /^-?\d+(\.\d+)?$/.test(trimmed);
}

export type SafeQuestion = {
  id: string;
  test_id: string;
  order_index: number;
  type: QuestionType;
  question_text: string;
  image_url: string | null;
  marks: number;
  options: string[] | null;
};

export function toSafeQuestion(
  q: Pick<
    Question,
    | "id"
    | "test_id"
    | "order_index"
    | "type"
    | "question_text"
    | "image_url"
    | "marks"
    | "options"
  >
): SafeQuestion {
  return {
    id: q.id,
    test_id: q.test_id,
    order_index: q.order_index,
    type: q.type,
    question_text: q.question_text,
    image_url: q.image_url,
    marks: Number(q.marks),
    options: q.options as string[] | null,
  };
}

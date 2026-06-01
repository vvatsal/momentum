import type { ResponseStatus } from "@/types/database";

export type ResponseRow = {
  question_id: string;
  order_index: number;
  status: ResponseStatus;
  last_seen_at: string | null;
};

/** First unanswered by order; if all answered/skipped, last visited question. */
export function pickResumeQuestionId(
  responses: ResponseRow[],
  currentQuestionId: string | null
): string {
  const sorted = [...responses].sort((a, b) => a.order_index - b.order_index);

  const firstUnanswered = sorted.find((r) => r.status === "unanswered");
  if (firstUnanswered) return firstUnanswered.question_id;

  if (currentQuestionId && sorted.some((r) => r.question_id === currentQuestionId)) {
    return currentQuestionId;
  }

  const withVisit = sorted.filter((r) => r.last_seen_at);
  if (withVisit.length > 0) {
    withVisit.sort(
      (a, b) =>
        new Date(b.last_seen_at!).getTime() - new Date(a.last_seen_at!).getTime()
    );
    return withVisit[0].question_id;
  }

  return sorted[0]?.question_id ?? "";
}

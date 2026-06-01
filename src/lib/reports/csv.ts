export type AttemptReportRow = {
  attempt_id: string;
  student_email: string;
  student_name: string | null;
  status: string;
  started_at: string;
  submitted_at: string | null;
  total_score: number | null;
  max_score: number | null;
  total_time_seconds: number;
};

export type ResponseReportRow = {
  attempt_id: string;
  student_email: string;
  question_order: number;
  question_text: string;
  question_type: string;
  status: string;
  selected_option: string | null;
  numeric_answer: number | null;
  is_correct: boolean | null;
  awarded_marks: number | null;
  time_spent_seconds: number;
};

function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildAttemptsCsv(rows: AttemptReportRow[]): string {
  const headers = [
    "attempt_id",
    "student_email",
    "student_name",
    "status",
    "started_at",
    "submitted_at",
    "total_score",
    "max_score",
    "total_time_seconds",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.attempt_id,
        r.student_email,
        r.student_name,
        r.status,
        r.started_at,
        r.submitted_at,
        r.total_score,
        r.max_score,
        r.total_time_seconds,
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];
  return lines.join("\n");
}

export function buildResponsesCsv(rows: ResponseReportRow[]): string {
  const headers = [
    "attempt_id",
    "student_email",
    "question_order",
    "question_type",
    "question_text",
    "status",
    "selected_option",
    "numeric_answer",
    "is_correct",
    "awarded_marks",
    "time_spent_seconds",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.attempt_id,
        r.student_email,
        r.question_order,
        r.question_type,
        r.question_text,
        r.status,
        r.selected_option,
        r.numeric_answer,
        r.is_correct,
        r.awarded_marks,
        r.time_spent_seconds,
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];
  return lines.join("\n");
}

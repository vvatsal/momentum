import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubmittedSummary } from "@/app/actions/attempt";
import { requireProfile } from "@/lib/auth/session";
import { AppHeader } from "@/components/layout/app-header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import type { McqCorrectAnswer, NumericCorrectAnswer } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function TestReviewPage({
    params,
}: {
    params: { testId: string };
}) {
    await requireProfile("student");
    const data = await getSubmittedSummary(params.testId);

    if (!data?.test || !data.attempt) notFound();

    const { test, questions, responses } = data;

    return (
        <PageShell noPadding>
            <AppHeader title={`Review: ${test.title}`} homeHref={`/tests/${test.id}/summary`} />
            <div className="mx-auto max-w-lg space-y-6 px-4 py-6 sm:max-w-2xl">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/tests/${test.id}/summary`}>← Back to summary</Link>
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {questions.length} Questions
                    </span>
                </div>

                <div className="space-y-6">
                    {questions.map((q, i) => {
                        const r = responses.find((x) => x.question_id === q.id);
                        const isCorrect = r?.is_correct;
                        const isSkipped = r?.status === "skipped";
                        const isUnanswered = r?.status === "unanswered";

                        let studentAnswer: string[] = [];
                        if (q.type === "mcq" || q.type === "msq") {
                            if (r?.selected_option) {
                                try {
                                    const parsed = JSON.parse(r.selected_option);
                                    studentAnswer = Array.isArray(parsed) ? parsed : [r.selected_option];
                                } catch {
                                    studentAnswer = [r.selected_option];
                                }
                            }
                        } else {
                            studentAnswer = [r?.numeric_answer != null ? String(r.numeric_answer) : "—"];
                        }

                        let correctOptions: string[] = [];
                        if (q.type === "mcq" || q.type === "msq") {
                            correctOptions = (q.correct_answer as McqCorrectAnswer).options || [];
                        } else {
                            correctOptions = [String((q.correct_answer as NumericCorrectAnswer).value)];
                        }

                        return (
                            <Card key={q.id} className={`overflow-hidden border-l-4 ${isCorrect ? "border-l-emerald-500" : isSkipped || isUnanswered ? "border-l-amber-500" : "border-l-destructive"
                                }`}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <CardTitle className="text-base font-semibold">
                                            <span className="text-muted-foreground mr-2">Q{i + 1}.</span>
                                            {q.question_text}
                                        </CardTitle>
                                        <div className="shrink-0">
                                            {isCorrect ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                            ) : isSkipped || isUnanswered ? (
                                                <HelpCircle className="h-5 w-5 text-amber-500" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-destructive" />
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {(q.type === "mcq" || q.type === "msq") && q.options && (
                                        <div className="grid gap-2">
                                            {(q.options as string[]).map((opt) => {
                                                const isStudentChoice = studentAnswer.includes(opt);
                                                const isCorrectChoice = correctOptions.includes(opt);
                                                return (
                                                    <div
                                                        key={opt}
                                                        className={`rounded-lg border p-3 text-sm flex items-center justify-between ${isCorrectChoice
                                                            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
                                                            : isStudentChoice
                                                                ? "bg-destructive/10 border-destructive/50 text-destructive-foreground"
                                                                : "bg-muted/50"
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {q.type === "mcq" ? (
                                                                <div className={`h-4 w-4 rounded-full border ${isCorrectChoice ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground"}`}>
                                                                    {isCorrectChoice && <div className="h-1.5 w-1.5 rounded-full bg-white m-auto mt-1" />}
                                                                </div>
                                                            ) : (
                                                                <div className={`h-4 w-4 rounded border ${isCorrectChoice ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground"}`}>
                                                                    {isCorrectChoice && <CheckCircle2 className="h-3 w-3 text-white m-auto" />}
                                                                </div>
                                                            )}
                                                            <span>{opt}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {isCorrectChoice && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Correct</span>}
                                                            {isStudentChoice && !isCorrectChoice && <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">Your Choice</span>}
                                                            {isStudentChoice && isCorrectChoice && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Your Choice</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {q.type === "numeric" && (
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="rounded-lg bg-muted p-3">
                                                <p className="text-xs text-muted-foreground mb-1">Your Answer</p>
                                                <p className="font-mono font-bold">{studentAnswer[0]}</p>
                                            </div>
                                            <div className="rounded-lg bg-emerald-500/10 p-3">
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Correct Answer</p>
                                                <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{correctOptions[0]}</p>
                                            </div>
                                        </div>
                                    )}

                                    {q.explanation && (
                                        <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-4">
                                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Explanation</p>
                                            <p className="text-sm leading-relaxed">{q.explanation}</p>
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <span className="text-xs font-medium px-2 py-1 rounded bg-muted">
                                            Marks: {r?.awarded_marks ?? 0} / {q.marks}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-3">
                    <Button asChild className="w-full" variant="secondary">
                        <Link href={`/tests/${test.id}/attempt?retest=true`}>Retake Test</Link>
                    </Button>
                    <Button asChild className="w-full" variant="outline">
                        <Link href="/dashboard">Return to Dashboard</Link>
                    </Button>
                </div>
            </div>
        </PageShell>
    );
}

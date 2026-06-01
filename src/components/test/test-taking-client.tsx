"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  finalSubmit,
  flushQuestionTiming,
  syncQuestionNavigation,
  type AttemptBundle,
  type AttemptResponseState,
} from "@/app/actions/attempt";
import { QuestionPalette } from "@/components/test/question-palette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuestionTimer } from "@/hooks/use-question-timer";
import { formatDuration } from "@/lib/format";
import { isValidNumericInput, parseNumericInput } from "@/lib/scoring";
import type { ResponseStatus } from "@/types/database";
import { Check, Loader2 } from "lucide-react";

type Props = {
  initial: AttemptBundle;
};

type LeaveAnswer = {
  status: ResponseStatus;
  selectedOption?: string | null;
  numericAnswer?: number | null;
};

export function TestTakingClient({ initial }: Props) {
  const router = useRouter();
  const [questions] = useState(initial.questions);
  const [responses, setResponses] = useState<AttemptResponseState[]>(
    initial.responses
  );
  const [currentId, setCurrentId] = useState(initial.resumeQuestionId);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mcqSelection, setMcqSelection] = useState<string | null>(null);
  const [numericInput, setNumericInput] = useState("");
  const [numericError, setNumericError] = useState<string | null>(null);

  const attemptId = initial.attempt.id;
  const testId = initial.test.id;
  const syncingRef = useRef(false);

  const currentIndex = questions.findIndex((q) => q.id === currentId);
  const currentQuestion = questions[currentIndex];
  const { elapsed, consumeDelta } = useQuestionTimer(!!currentQuestion);

  const totalActiveSeconds =
    responses.reduce((s, r) => s + r.time_spent_seconds, 0) + elapsed;

  const durationLimit = initial.test.duration_minutes
    ? initial.test.duration_minutes * 60
    : null;

  const progressPct =
    questions.length > 0
      ? (responses.filter((r) => r.status !== "unanswered").length /
          questions.length) *
        100
      : 0;

  const paletteItems = useMemo(
    () =>
      questions.map((q, index) => ({
        questionId: q.id,
        index,
        status:
          responses.find((r) => r.question_id === q.id)?.status ?? "unanswered",
      })),
    [questions, responses]
  );

  const loadLocalAnswer = useCallback(
    (questionId: string) => {
      const r = responses.find((x) => x.question_id === questionId);
      const q = questions.find((x) => x.id === questionId);
      if (!r || !q) return;
      if (q.type === "mcq") {
        setMcqSelection(r.selected_option);
        setNumericInput("");
      } else {
        setNumericInput(
          r.numeric_answer != null ? String(r.numeric_answer) : ""
        );
        setMcqSelection(null);
      }
      setNumericError(null);
    },
    [responses, questions]
  );

  useEffect(() => {
    loadLocalAnswer(currentId);
  }, [currentId, loadLocalAnswer]);

  const applyLocalResponse = useCallback(
    (
      questionId: string,
      patch: Partial<AttemptResponseState> & { status?: ResponseStatus }
    ) => {
      setResponses((prev) =>
        prev.map((r) =>
          r.question_id === questionId ? { ...r, ...patch } : r
        )
      );
    },
    []
  );

  const buildLeaveAnswer = useCallback((): LeaveAnswer | undefined => {
    const q = questions.find((x) => x.id === currentId);
    if (!q) return undefined;

    if (q.type === "mcq" && mcqSelection) {
      return { status: "answered", selectedOption: mcqSelection };
    }
    if (q.type === "numeric" && numericInput.trim()) {
      if (!isValidNumericInput(numericInput)) {
        setNumericError("Enter a valid number (e.g. 3.14)");
        return undefined;
      }
      return {
        status: "answered",
        numericAnswer: parseNumericInput(numericInput),
      };
    }
    return undefined;
  }, [currentId, mcqSelection, numericInput, questions]);

  const runSync = useCallback(
    async (
      leaveId: string,
      enterId: string,
      delta: number,
      leaveAnswer?: LeaveAnswer
    ) => {
      if (syncingRef.current) return { ok: true as const };
      syncingRef.current = true;
      setSaveState("saving");

      const res = await syncQuestionNavigation({
        attemptId,
        leaveQuestionId: leaveId,
        enterQuestionId: enterId,
        leaveTimeDelta: delta,
        leaveAnswer,
      });

      syncingRef.current = false;
      if (res.ok) {
        setSaveState("saved");
        window.setTimeout(() => setSaveState("idle"), 800);
      } else {
        setSaveState("idle");
        setError(res.error);
      }
      return res;
    },
    [attemptId]
  );

  const navigateTo = useCallback(
    async (nextId: string, forceAnswer?: LeaveAnswer) => {
      if (nextId === currentId) return false;

      const leaveAnswer = forceAnswer ?? buildLeaveAnswer();
      if (!forceAnswer && leaveAnswer === undefined) {
        const q = questions.find((x) => x.id === currentId);
        if (
          q?.type === "numeric" &&
          numericInput.trim() &&
          !isValidNumericInput(numericInput)
        ) {
          return false;
        }
      }

      const delta = consumeDelta();
      const prevId = currentId;

      if (leaveAnswer) {
        applyLocalResponse(prevId, {
          status: leaveAnswer.status,
          selected_option: leaveAnswer.selectedOption ?? null,
          numeric_answer: leaveAnswer.numericAnswer ?? null,
        });
      }
      if (delta > 0) {
        applyLocalResponse(prevId, {
          time_spent_seconds:
            (responses.find((r) => r.question_id === prevId)?.time_spent_seconds ??
              0) + delta,
        });
      }

      setCurrentId(nextId);
      setError(null);

      void runSync(prevId, nextId, delta, leaveAnswer);
      return true;
    },
    [
      applyLocalResponse,
      buildLeaveAnswer,
      consumeDelta,
      currentId,
      numericInput,
      questions,
      responses,
      runSync,
    ]
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      const delta = consumeDelta();
      if (delta <= 0 || syncingRef.current) return;

      setResponses((prev) =>
        prev.map((r) =>
          r.question_id === currentId
            ? { ...r, time_spent_seconds: r.time_spent_seconds + delta }
            : r
        )
      );

      void flushQuestionTiming({
        attemptId,
        questionId: currentId,
        deltaSeconds: delta,
      });
    }, 12000);

    return () => window.clearInterval(id);
  }, [attemptId, consumeDelta, currentId]);

  const handleSaveAndNext = async () => {
    const q = currentQuestion;
    if (!q) return;

    let leave: LeaveAnswer | undefined;
    if (q.type === "mcq") {
      if (!mcqSelection) {
        setError("Select an option or tap Skip");
        return;
      }
      leave = { status: "answered", selectedOption: mcqSelection };
    } else {
      if (!numericInput.trim()) {
        setError("Enter an answer or tap Skip");
        return;
      }
      if (!isValidNumericInput(numericInput)) {
        setNumericError("Enter a valid number (e.g. 3.14)");
        return;
      }
      leave = {
        status: "answered",
        numericAnswer: parseNumericInput(numericInput),
      };
    }

    const next = questions[currentIndex + 1];
    if (next) {
      await navigateTo(next.id, leave);
    } else {
      const delta = consumeDelta();
      applyLocalResponse(currentId, {
        status: leave.status,
        selected_option: leave.selectedOption ?? null,
        numeric_answer: leave.numericAnswer ?? null,
        time_spent_seconds:
          (responses.find((r) => r.question_id === currentId)
            ?.time_spent_seconds ?? 0) + delta,
      });
      void runSync(currentId, currentId, delta, leave);
    }
  };

  const handleSkip = async () => {
    const next = questions[currentIndex + 1];
    const leave: LeaveAnswer = { status: "skipped" };
    if (next) {
      await navigateTo(next.id, leave);
    } else {
      const delta = consumeDelta();
      applyLocalResponse(currentId, { status: "skipped", time_spent_seconds:
          (responses.find((r) => r.question_id === currentId)?.time_spent_seconds ?? 0) + delta });
      void runSync(currentId, currentId, delta, leave);
    }
  };

  const handleExit = async () => {
    const delta = consumeDelta();
    const leave = buildLeaveAnswer();
    void runSync(currentId, currentId, delta, leave);
    router.push(`/tests/${testId}`);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    const delta = consumeDelta();
    const leave = buildLeaveAnswer();
    await runSync(currentId, currentId, delta, leave);

    const res = await finalSubmit({ attemptId });
    setSubmitting(false);
    setSubmitOpen(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/tests/${testId}/summary`);
    router.refresh();
  };

  if (!currentQuestion) {
    return <p className="p-4 text-sm text-muted-foreground">No questions.</p>;
  }

  return (
    <div className="mesh-bg flex min-h-dvh flex-col pb-28">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] glass-strong">
        <div className="mx-auto max-w-lg space-y-2.5 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="truncate text-sm font-bold tracking-tight">
              {initial.test.title}
            </h1>
            <span className="shrink-0 text-xs font-medium">
              {saveState === "saving" && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin text-cyan-400" /> Saving
                </span>
              )}
              {saveState === "saved" && (
                <span className="inline-flex items-center gap-1 text-cyan-400">
                  <Check className="h-3 w-3" /> Saved
                </span>
              )}
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Q{currentIndex + 1}/{questions.length}
            </span>
            <span>
              Time {formatDuration(totalActiveSeconds)}
              {durationLimit != null && (
                <> / {formatDuration(durationLimit)}</>
              )}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 space-y-4 px-4 py-4">
        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="glass animate-slide-up rounded-2xl p-5">
          <p className="mb-2 inline-flex rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-500/20">
            {currentQuestion.marks} mark
            {Number(currentQuestion.marks) !== 1 ? "s" : ""}
          </p>
          <p className="text-base font-medium leading-relaxed">
            {currentQuestion.question_text}
          </p>

          {currentQuestion.type === "mcq" && currentQuestion.options && (
            <div className="mt-5 space-y-2">
              {currentQuestion.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMcqSelection(opt)}
                  className={`tap-scale w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-[border-color,background,box-shadow] duration-150 ${
                    mcqSelection === opt
                      ? "border-cyan-500/50 bg-cyan-500/15 shadow-glow-sm ring-1 ring-cyan-500/30"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.type === "numeric" && (
            <div className="mt-4 space-y-1">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Your answer"
                value={numericInput}
                onChange={(e) => {
                  setNumericInput(e.target.value);
                  setNumericError(null);
                }}
              />
              {numericError && (
                <p className="text-xs text-destructive">{numericError}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Jump to question
          </p>
          <QuestionPalette
            items={paletteItems}
            currentQuestionId={currentId}
            onSelect={(id) => void navigateTo(id)}
          />
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-palette-unanswered/40" /> Unanswered
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-palette-answered" /> Answered
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-palette-skipped" /> Skipped
            </span>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] glass-strong p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={handleSkip}>
              Skip
            </Button>
            <Button type="button" onClick={handleSaveAndNext}>
              {currentIndex < questions.length - 1 ? "Save & next" : "Save"}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="ghost" onClick={handleExit}>
              Exit (resume later)
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSubmitOpen(true)}
            >
              Final submit
            </Button>
          </div>
        </div>
      </footer>

      <AlertDialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit test?</AlertDialogTitle>
            <AlertDialogDescription>
              You cannot change answers after submitting. Unanswered questions
              will score zero.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

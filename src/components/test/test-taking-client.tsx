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
import {
  saveMcqQuestion,
  saveMsqQuestion,
  saveNumericQuestion,
} from "@/app/actions/test";
import { QuestionPalette } from "@/components/test/question-palette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, Edit2, Save, X, Plus, Trash2 } from "lucide-react";
import { slideInRight, staggerContainer, fadeUp } from "@/lib/motion";

type Props = {
  initial: AttemptBundle;
  userRole: "admin" | "student";
};

type LeaveAnswer = {
  status: ResponseStatus;
  selectedOption?: string | null;
  numericAnswer?: number | null;
};

export function TestTakingClient({ initial, userRole }: Props) {
  const isAdmin = userRole === "admin";
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    text: string;
    options: string[];
    marks: number;
    correctAnswer: any;
    tolerance?: number;
    explanation?: string;
  } | null>(null);
  const reduce = useReducedMotion();
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
  const [mcqSelections, setMcqSelections] = useState<string[]>([]);
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
        let selected: string[] = [];
        if (r.selected_option) {
          try {
            const parsed = JSON.parse(r.selected_option);
            if (Array.isArray(parsed)) selected = parsed;
            else selected = [r.selected_option];
          } catch {
            selected = [r.selected_option];
          }
        }
        setMcqSelections(selected);
        setNumericInput("");
      } else {
        setNumericInput(
          r.numeric_answer != null ? String(r.numeric_answer) : ""
        );
        setMcqSelections([]);
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

    if ((q.type === "mcq" || q.type === "msq") && mcqSelections.length > 0) {
      return { status: "answered", selectedOption: JSON.stringify(mcqSelections) };
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
  }, [currentId, mcqSelections, numericInput, questions]);

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
    if (q.type === "mcq" || q.type === "msq") {
      if (mcqSelections.length === 0) {
        setError("Select at least one option or tap Skip");
        return;
      }
      leave = { status: "answered", selectedOption: JSON.stringify(mcqSelections) };
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
      applyLocalResponse(currentId, {
        status: "skipped", time_spent_seconds:
          (responses.find((r) => r.question_id === currentId)?.time_spent_seconds ?? 0) + delta
      });
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
    <div className="flex min-h-dvh flex-col pb-32">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] glass backdrop-blur-2xl">
        <div className="mx-auto max-w-lg px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight">
                {initial.test.title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Question {currentIndex + 1} of {questions.length}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-mono font-bold tabular-nums text-primary">
                {formatDuration(totalActiveSeconds)}
              </span>
              {durationLimit != null && (
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                  Limit: {formatDuration(durationLimit)}
                </span>
              )}
            </div>
          </div>

          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-sky-400 to-accent"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 space-y-4 px-4 py-4">
        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentId}
            variants={reduce ? undefined : slideInRight}
            initial="hidden"
            animate="show"
            exit="exit"
            className="bento-card p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <Badge variant="secondary" className="h-6 px-3 font-bold uppercase tracking-widest text-[10px]">
                {currentQuestion.marks} mark{Number(currentQuestion.marks) !== 1 ? "s" : ""}
              </Badge>
              <AnimatePresence mode="wait">
                {saveState === "saving" && (
                  <motion.div
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    Syncing
                  </motion.div>
                )}
                {saveState === "saved" && (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400"
                  >
                    <Check className="h-3 w-3" /> Saved
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="group relative">
              {isAdmin && !isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setEditData({
                      text: currentQuestion.question_text,
                      options: [...(currentQuestion.options || [])],
                      marks: currentQuestion.marks,
                      correctAnswer: (currentQuestion as any).correct_answer || (currentQuestion.type === "numeric" ? { value: 0 } : { options: [] }),
                      tolerance: (currentQuestion as any).numeric_tolerance ?? 0,
                      explanation: (currentQuestion as any).explanation ?? "",
                    });
                    setIsEditing(true);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}

              {isEditing ? (
                <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Question Text</label>
                    <textarea
                      value={editData?.text}
                      onChange={(e) => setEditData(prev => prev ? { ...prev, text: e.target.value } : null)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      rows={3}
                    />
                  </div>

                  {currentQuestion.type === "numeric" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Correct Value</label>
                        <Input
                          type="number"
                          step="any"
                          value={editData?.correctAnswer?.value ?? ""}
                          onChange={(e) => setEditData(prev => prev ? { ...prev, correctAnswer: { ...prev.correctAnswer, value: parseFloat(e.target.value) } } : null)}
                          className="bg-black/20 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tolerance</label>
                        <Input
                          type="number"
                          step="any"
                          value={editData?.tolerance ?? ""}
                          onChange={(e) => setEditData(prev => prev ? { ...prev, tolerance: parseFloat(e.target.value) } : null)}
                          className="bg-black/20 border-white/10"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Marks</label>
                      <Input
                        type="number"
                        step="0.5"
                        value={editData?.marks}
                        onChange={(e) => setEditData(prev => prev ? { ...prev, marks: parseFloat(e.target.value) } : null)}
                        className="bg-black/20 border-white/10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!editData) return;
                        setSubmitting(true);
                        let res;
                        if (currentQuestion.type === "mcq") {
                          res = await saveMcqQuestion({
                            testId,
                            questionId: currentQuestion.id,
                            question_text: editData.text,
                            marks: editData.marks,
                            options: editData.options,
                            correct_option: editData.correctAnswer.options[0],
                            explanation: editData.explanation,
                          });
                        } else if (currentQuestion.type === "msq") {
                          res = await saveMsqQuestion({
                            testId,
                            questionId: currentQuestion.id,
                            question_text: editData.text,
                            marks: editData.marks,
                            options: editData.options,
                            correct_options: editData.correctAnswer.options,
                            explanation: editData.explanation,
                          });
                        } else {
                          res = await saveNumericQuestion({
                            testId,
                            questionId: currentQuestion.id,
                            question_text: editData.text,
                            marks: editData.marks,
                            correct_value: editData.correctAnswer.value,
                            numeric_tolerance: editData.tolerance,
                            explanation: editData.explanation,
                          });
                        }

                        if (res.ok) {
                          setIsEditing(false);
                          router.refresh();
                        } else {
                          setError(res.error);
                        }
                        setSubmitting(false);
                      }}
                      disabled={submitting}
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Changes
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <h2 className="text-xl font-bold leading-relaxed tracking-tight">
                  {currentQuestion.question_text}
                </h2>
              )}
            </div>

            {(currentQuestion.type === "mcq" || currentQuestion.type === "msq") && currentQuestion.options && (
              <motion.div
                className="mt-6 space-y-2.5"
                variants={reduce ? undefined : staggerContainer}
                initial="hidden"
                animate="show"
              >
                {currentQuestion.type === "mcq" && (
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-3">Single correct answer</p>
                )}
                {currentQuestion.type === "msq" && (
                  <p className="text-xs text-primary font-bold uppercase tracking-widest mb-3">Select all correct answers</p>
                )}
                {isEditing ? (
                  <div className="space-y-3 mt-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Options & Correct Answer</label>
                    {editData?.options.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        {currentQuestion.type === "mcq" ? (
                          <input
                            type="radio"
                            name="correct-option"
                            checked={editData.correctAnswer.options.includes(opt)}
                            onChange={() => setEditData(prev => prev ? { ...prev, correctAnswer: { options: [opt] } } : null)}
                            className="h-4 w-4 text-primary"
                          />
                        ) : (
                          <input
                            type="checkbox"
                            checked={editData.correctAnswer.options.includes(opt)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...editData.correctAnswer.options, opt]
                                : editData.correctAnswer.options.filter((o: string) => o !== opt);
                              setEditData(prev => prev ? { ...prev, correctAnswer: { options: next } } : null);
                            }}
                            className="h-4 w-4 text-primary rounded"
                          />
                        )}
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const oldVal = editData.options[idx];
                            const next = [...(editData?.options || [])];
                            next[idx] = e.target.value;

                            // Also update correct answers if the text changed
                            let nextCorrect = [...editData.correctAnswer.options];
                            if (nextCorrect.includes(oldVal)) {
                              nextCorrect = nextCorrect.map(o => o === oldVal ? e.target.value : o);
                            }

                            setEditData(prev => prev ? { ...prev, options: next, correctAnswer: { options: nextCorrect } } : null);
                          }}
                          className="bg-black/20 border-white/10"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const val = editData.options[idx];
                            const next = editData?.options.filter((_, i) => i !== idx) || [];
                            const nextCorrect = editData.correctAnswer.options.filter((o: string) => o !== val);
                            setEditData(prev => prev ? { ...prev, options: next, correctAnswer: { options: nextCorrect } } : null);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => {
                        setEditData(prev => prev ? { ...prev, options: [...prev.options, ""] } : null);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Option
                    </Button>
                  </div>
                ) : (
                  currentQuestion.options.map((opt) => (
                    <motion.button
                      key={opt}
                      type="button"
                      variants={reduce ? undefined : fadeUp}
                      onClick={() => {
                        if (currentQuestion.type === "mcq") {
                          setMcqSelections([opt]);
                        } else {
                          setMcqSelections((prev) =>
                            prev.includes(opt)
                              ? prev.filter((o) => o !== opt)
                              : [...prev, opt]
                          );
                        }
                      }}
                      whileTap={reduce ? undefined : { scale: 0.98 }}
                      className={`option-chip ${mcqSelections.includes(opt) ? "option-chip-selected" : ""}`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        {currentQuestion.type === "mcq" ? (
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${mcqSelections.includes(opt)
                            ? "bg-primary border-primary"
                            : "border-white/20 bg-white/5"
                            }`}>
                            {mcqSelections.includes(opt) && <div className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />}
                          </div>
                        ) : (
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${mcqSelections.includes(opt)
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-white/20 bg-white/5"
                            }`}>
                            {mcqSelections.includes(opt) && <Check className="h-3.5 w-3.5" />}
                          </div>
                        )}
                        <span className="flex-1 text-left">{opt}</span>
                      </div>
                    </motion.button>
                  ))
                )}
              </motion.div>
            )}

            {currentQuestion.type === "numeric" && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-1"
              >
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Type your answer…"
                  value={numericInput}
                  onChange={(e) => {
                    setNumericInput(e.target.value);
                    setNumericError(null);
                  }}
                  className="h-12 text-lg"
                />
                {numericError && (
                  <p className="text-xs text-red-400">{numericError}</p>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

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

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] glass p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" onClick={handleSkip} size="lg" className="h-12 rounded-2xl font-bold border-white/10 hover:bg-white/5">
              Skip Question
            </Button>
            <Button
              type="button"
              onClick={handleSaveAndNext}
              size="lg"
              className="h-12 rounded-2xl font-bold shine-btn"
            >
              {currentIndex < questions.length - 1 ? "Next Question" : "Save Answer"}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4 px-1">
            <Button type="button" variant="ghost" onClick={handleExit} size="sm" className="text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest">
              Exit Test
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSubmitOpen(true)}
              size="sm"
              className="h-8 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest border border-white/5"
            >
              Finish & Submit
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

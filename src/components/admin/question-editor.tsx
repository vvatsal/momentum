"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteQuestion,
  saveMcqQuestion,
  saveMsqQuestion,
  saveNumericQuestion,
} from "@/app/actions/test";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  McqCorrectAnswer,
  NumericCorrectAnswer,
  Question,
} from "@/types/database";
import { BulkUploadDialog } from "./bulk-upload-dialog";
import { AIQuestionGenerator } from "./ai-question-generator";

type Props = {
  testId: string;
  questions: Question[];
  isLocked: boolean;
};

export function QuestionEditor({ testId, questions, isLocked }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState<"mcq" | "msq" | "numeric" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLocked) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Questions are locked because at least one student has started this test.
        </p>
        <ul className="divide-y rounded-lg border">
          {questions.map((q, i) => (
            <li key={q.id} className="px-3 py-3 text-sm">
              <span className="text-muted-foreground">Q{i + 1}.</span>{" "}
              {q.question_text}{" "}
              <span className="text-xs text-muted-foreground">
                ({q.type}, {q.marks} marks)
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {questions.map((q, i) => (
          <li key={q.id} className="rounded-lg border p-3">
            {editingId === q.id ? (
              <QuestionForm
                testId={testId}
                question={q}
                onDone={() => {
                  setEditingId(null);
                  router.refresh();
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 text-sm">
                  <p className="font-medium">
                    Q{i + 1}. {q.question_text}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {q.type} · {q.marks} marks
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(q.id)}
                  >
                    Edit
                  </Button>
                  <DeleteButton testId={testId} questionId={q.id} />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding === "mcq" && (
        <McqForm
          testId={testId}
          onDone={() => { setAdding(null); router.refresh(); }}
          onCancel={() => setAdding(null)}
        />
      )}
      {adding === "msq" && (
        <MsqForm
          testId={testId}
          onDone={() => { setAdding(null); router.refresh(); }}
          onCancel={() => setAdding(null)}
        />
      )}
      {adding === "numeric" && (
        <NumericForm
          testId={testId}
          onDone={() => {
            setAdding(null);
            router.refresh();
          }}
          onCancel={() => setAdding(null)}
        />
      )}

      {!adding && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setAdding("mcq")}>
            + MCQ (Single)
          </Button>
          <Button type="button" variant="outline" onClick={() => setAdding("msq")}>
            + MSQ (Multi)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAdding("numeric")}
          >
            + Numeric
          </Button>
          <div className="ml-auto flex gap-2">
            <AIQuestionGenerator testId={testId} />
            <BulkUploadDialog testId={testId} />
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionForm({
  testId,
  question,
  onDone,
  onCancel,
}: {
  testId: string;
  question: Question;
  onDone: () => void;
  onCancel: () => void;
}) {
  if (question.type === "mcq") {
    return (
      <McqForm
        testId={testId}
        question={question}
        onDone={onDone}
        onCancel={onCancel}
      />
    );
  }
  if (question.type === "msq") {
    return (
      <MsqForm
        testId={testId}
        question={question}
        onDone={onDone}
        onCancel={onCancel}
      />
    );
  }
  return (
    <NumericForm
      testId={testId}
      question={question}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

function DeleteButton({
  testId,
  questionId,
}: {
  testId: string;
  questionId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this question?")) return;
    setPending(true);
    await deleteQuestion({ testId, questionId });
    setPending(false);
    router.refresh();
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="text-destructive"
      disabled={pending}
      onClick={onDelete}
    >
      Del
    </Button>
  );
}

function McqForm({
  testId,
  question,
  onDone,
  onCancel,
}: {
  testId: string;
  question?: Question;
  onDone: () => void;
  onCancel: () => void;
}) {
  const correct = question?.correct_answer as McqCorrectAnswer | undefined;
  const options = (question?.options as string[] | null) ?? ["", "", "", ""];
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [opts, setOpts] = useState<string[]>(
    options.length >= 2 ? options : ["", "", "", ""]
  );
  const [correctOptions, setCorrectOptions] = useState<string[]>(
    correct?.options ?? []
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const filtered = opts.map((o) => o.trim()).filter(Boolean);
    const filteredCorrect = correctOptions.map(o => o.trim()).filter(o => filtered.includes(o));

    if (filteredCorrect.length === 0) {
      setError("Select at least one correct option");
      setPending(false);
      return;
    }

    const result = await saveMcqQuestion({
      testId,
      questionId: question?.id,
      question_text: fd.get("question_text"),
      marks: fd.get("marks"),
      options: filtered,
      correct_options: filteredCorrect,
      explanation: (fd.get("explanation") as string) || null,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label>Question</Label>
        <textarea
          name="question_text"
          required
          rows={2}
          defaultValue={question?.question_text ?? ""}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label>Marks</Label>
        <Input
          name="marks"
          type="number"
          step="0.5"
          min={0.5}
          defaultValue={question?.marks ?? 1}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Options & Correct Answers</Label>
        {opts.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={correctOptions.includes(opt) && opt !== ""}
              onChange={(e) => {
                if (e.target.checked) {
                  setCorrectOptions([...correctOptions, opt]);
                } else {
                  setCorrectOptions(correctOptions.filter((o) => o !== opt));
                }
              }}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Input
              value={opt}
              onChange={(e) => {
                const next = [...opts];
                const oldVal = next[i];
                next[i] = e.target.value;
                setOpts(next);
                // Update correct options if the text changed
                if (correctOptions.includes(oldVal)) {
                  setCorrectOptions(correctOptions.map(o => o === oldVal ? e.target.value : o));
                }
              }}
              placeholder={`Option ${i + 1}`}
            />
          </div>
        ))}
        {opts.length < 8 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpts([...opts, ""])}
          >
            + Option
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function MsqForm({
  testId,
  question,
  onDone,
  onCancel,
}: {
  testId: string;
  question?: Question;
  onDone: () => void;
  onCancel: () => void;
}) {
  const correct = question?.correct_answer as McqCorrectAnswer | undefined;
  const initialOpts = (question?.options as string[] | null) ?? ["", "", "", ""];
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [opts, setOpts] = useState<string[]>(
    initialOpts.length >= 2 ? initialOpts : ["", "", "", ""]
  );
  const [correctOptions, setCorrectOptions] = useState<string[]>(
    correct?.options ?? []
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const filtered = opts.map((o) => o.trim()).filter(Boolean);
    const filteredCorrect = correctOptions.map((o) => o.trim()).filter((o) => filtered.includes(o));

    if (filteredCorrect.length < 2) {
      setError("Select at least 2 correct options");
      setPending(false);
      return;
    }

    const result = await saveMsqQuestion({
      testId,
      questionId: question?.id,
      question_text: fd.get("question_text"),
      marks: fd.get("marks"),
      options: filtered,
      correct_options: filteredCorrect,
      explanation: (fd.get("explanation") as string) || null,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label>Question <span className="text-xs text-primary font-bold">(Multiple Correct)</span></Label>
        <textarea
          name="question_text"
          required
          rows={2}
          defaultValue={question?.question_text ?? ""}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label>Marks</Label>
        <Input
          name="marks"
          type="number"
          step="0.5"
          min={0.5}
          defaultValue={question?.marks ?? 2}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Options <span className="text-xs text-muted-foreground">(check all correct ones)</span></Label>
        {opts.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={correctOptions.includes(opt) && opt !== ""}
              onChange={(e) => {
                if (e.target.checked) {
                  setCorrectOptions([...correctOptions, opt]);
                } else {
                  setCorrectOptions(correctOptions.filter((o) => o !== opt));
                }
              }}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Input
              value={opt}
              onChange={(e) => {
                const next = [...opts];
                const oldVal = next[i];
                next[i] = e.target.value;
                setOpts(next);
                if (correctOptions.includes(oldVal)) {
                  setCorrectOptions(correctOptions.map((o: string) => o === oldVal ? e.target.value : o));
                }
              }}
              placeholder={`Option ${i + 1}`}
            />
          </div>
        ))}
        {opts.length < 8 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpts([...opts, ""])}>
            + Option
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>Save</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function NumericForm({
  testId,
  question,
  onDone,
  onCancel,
}: {
  testId: string;
  question?: Question;
  onDone: () => void;
  onCancel: () => void;
}) {
  const correct = question?.correct_answer as NumericCorrectAnswer | undefined;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await saveNumericQuestion({
      testId,
      questionId: question?.id,
      question_text: fd.get("question_text"),
      marks: fd.get("marks"),
      correct_value: fd.get("correct_value"),
      numeric_tolerance: fd.get("numeric_tolerance") || null,
      explanation: (fd.get("explanation") as string) || null,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label>Question</Label>
        <textarea
          name="question_text"
          required
          rows={2}
          defaultValue={question?.question_text ?? ""}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Marks</Label>
          <Input
            name="marks"
            type="number"
            step="0.5"
            min={0.5}
            defaultValue={question?.marks ?? 1}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Correct value</Label>
          <Input
            name="correct_value"
            type="number"
            step="any"
            required
            defaultValue={correct?.value ?? ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Tolerance (optional)</Label>
        <Input
          name="numeric_tolerance"
          type="number"
          step="any"
          min={0}
          defaultValue={question?.numeric_tolerance ?? ""}
          placeholder="e.g. 0.01 for decimals"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

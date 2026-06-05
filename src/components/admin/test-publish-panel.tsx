"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  archiveTest,
  deleteTest,
  publishTest,
  updateTestVisibility,
} from "@/app/actions/test";
import { Button } from "@/components/ui/button";
import type { TestStatus, Profile } from "@/types/database";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  testId: string;
  status: TestStatus;
  questionCount: number;
  isLocked: boolean;
  students: Profile[];
  initialSelectedStudentIds: string[];
};

export function TestPublishPanel({
  testId,
  status,
  questionCount,
  isLocked,
  students = [],
  initialSelectedStudentIds = [],
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sendEmails, setSendEmails] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(initialSelectedStudentIds);

  async function onPublish() {
    if (selectedStudentIds.length === 0) {
      if (!confirm("No students are selected. This test will not be visible to any student. Publish anyway?")) {
        return;
      }
    } else {
      if (!confirm(`Publish this test? It will be visible to the ${selectedStudentIds.length} selected student(s).`)) {
        return;
      }
    }
    setPending(true);
    setError(null);
    setInfo(null);

    // Save visibility assignment first
    const visResult = await updateTestVisibility(testId, selectedStudentIds);
    if (!visResult.ok) {
      setError(visResult.error);
      setPending(false);
      return;
    }

    const result = await publishTest({ testId, sendEmails });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInfo(result.data?.email ?? "Published successfully");
    router.refresh();
  }

  async function onArchive() {
    if (!confirm("Archive this test? Students will no longer see it.")) return;
    setPending(true);
    const result = await archiveTest({ testId });
    setPending(false);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  async function onDelete() {
    if (!confirm("Delete this test permanently? All questions and student attempts/scores will be deleted.")) return;
    setPending(true);
    const result = await deleteTest(testId);
    setPending(false);
    if (!result.ok) setError(result.error);
    else router.push("/admin");
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {questionCount} question{questionCount === 1 ? "" : "s"}
        {isLocked ? " · Locked (attempts exist)" : ""}
      </p>

      {/* Visibility Assignments Checklist */}
      <div className="space-y-2 rounded-xl border border-white/10 p-4 bg-white/[0.02]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <label className="text-sm font-bold text-foreground">Visible to Students</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 hover:bg-white/5 border border-white/5 text-primary rounded-lg font-bold"
              onClick={() => setSelectedStudentIds(students.map((s) => s.id))}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 hover:bg-red-500/10 border border-red-500/10 text-destructive rounded-lg font-bold"
              onClick={() => setSelectedStudentIds([])}
            >
              Clear All
            </Button>
          </div>
        </div>

        {students.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">No students registered yet.</p>
        ) : (
          <div className="max-h-40 overflow-y-auto space-y-2.5 scrollbar-thin pr-1 border border-white/[0.04] rounded-lg p-2 bg-black/20">
            {students.map((student) => {
              const isChecked = selectedStudentIds.includes(student.id);
              const username = student.username || student.email.split("@")[0];
              return (
                <label
                  key={student.id}
                  className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    className="rounded border-white/20 bg-black/30 text-primary focus:ring-primary/20"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudentIds((prev) => [...prev, student.id]);
                      } else {
                        setSelectedStudentIds((prev) => prev.filter((id) => id !== student.id));
                      }
                    }}
                  />
                  <span className="truncate">
                    <strong className="text-foreground/90">{student.full_name || "No name"}</strong>{" "}
                    <span className="text-muted-foreground/60 font-mono">@{username}</span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {status === "draft" && (
        <div className="space-y-3 rounded-xl border border-white/10 p-4 bg-white/[0.02]">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendEmails}
              className="rounded border-white/20 bg-black/30 text-primary focus:ring-primary/20"
              onChange={(e) => setSendEmails(e.target.checked)}
            />
            Email assigned students on publish (requires Resend)
          </label>
          <Button
            type="button"
            className="w-full shine-btn font-bold"
            disabled={pending || questionCount < 1}
            onClick={onPublish}
          >
            Publish test
          </Button>
          {questionCount < 1 && (
            <p className="text-xs text-muted-foreground">
              Add at least one question first.
            </p>
          )}
        </div>
      )}

      {status === "published" && (
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-4 bg-white/[0.02]">
          <Button
            type="button"
            className="w-full shine-btn font-bold"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              setError(null);
              setInfo(null);
              const result = await updateTestVisibility(testId, selectedStudentIds);
              setPending(false);
              if (!result.ok) {
                setError(result.error);
              } else {
                setInfo("Visibility updated successfully");
                toast({
                  title: "Visibility updated",
                  description: "Successfully updated student visibility settings for this test.",
                });
                router.refresh();
              }
            }}
          >
            Update Visibility
          </Button>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/[0.06]">
            <Button variant="outline" asChild className="h-9 text-xs font-bold border-white/10 hover:bg-white/5">
              <Link href={`/admin/tests/${testId}/reports`}>View reports</Link>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 text-xs font-bold"
              disabled={pending}
              onClick={onArchive}
            >
              Archive test
            </Button>
          </div>
        </div>
      )}

      {status === "archived" && (
        <Button variant="outline" asChild className="w-full border-white/10 hover:bg-white/5">
          <Link href={`/admin/tests/${testId}/reports`}>View reports</Link>
        </Button>
      )}

      <div className="pt-2 border-t border-white/[0.06]">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="w-full font-bold"
          disabled={pending}
          onClick={onDelete}
        >
          Delete test
        </Button>
      </div>

      {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg mt-2">{error}</p>}
      {info && <p className="text-xs text-cyan-400 bg-cyan-500/10 px-3 py-2 rounded-lg mt-2">{info}</p>}
    </div>
  );
}

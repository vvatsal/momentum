"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  archiveTest,
  deleteDraftTest,
  publishTest,
} from "@/app/actions/test";
import { Button } from "@/components/ui/button";
import type { TestStatus } from "@/types/database";

type Props = {
  testId: string;
  status: TestStatus;
  questionCount: number;
  isLocked: boolean;
};

export function TestPublishPanel({
  testId,
  status,
  questionCount,
  isLocked,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sendEmails, setSendEmails] = useState(true);

  async function onPublish() {
    if (!confirm("Publish this test? Students will see it on their dashboard.")) {
      return;
    }
    setPending(true);
    setError(null);
    setInfo(null);
    const result = await publishTest({ testId, sendEmails });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInfo(result.data?.email ?? "Published");
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
    if (!confirm("Delete this draft test permanently?")) return;
    setPending(true);
    const result = await deleteDraftTest(testId);
    setPending(false);
    if (!result.ok) setError(result.error);
    else router.push("/admin");
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {questionCount} question{questionCount === 1 ? "" : "s"}
        {isLocked ? " · Locked (attempts exist)" : ""}
      </p>

      {status === "draft" && (
        <div className="space-y-3 rounded-lg border p-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sendEmails}
              onChange={(e) => setSendEmails(e.target.checked)}
            />
            Email all students on publish (requires Resend)
          </label>
          <Button
            type="button"
            className="w-full"
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
        <div className="flex flex-col gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/tests/${testId}/reports`}>View reports & CSV</Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={onArchive}
          >
            Archive test
          </Button>
        </div>
      )}

      {status === "archived" && (
        <Button variant="outline" asChild>
          <Link href={`/admin/tests/${testId}/reports`}>View reports</Link>
        </Button>
      )}

      {status === "draft" && !isLocked && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={onDelete}
        >
          Delete draft
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {info && <p className="text-sm text-muted-foreground">{info}</p>}
    </div>
  );
}

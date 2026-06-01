"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTestMetadata } from "@/app/actions/test";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Test } from "@/types/database";

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = Pick<
  Test,
  | "id"
  | "title"
  | "description"
  | "instructions"
  | "duration_minutes"
  | "starts_at"
  | "ends_at"
  | "is_locked"
>;

export function TestMetadataForm({ test }: { test: Props }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const starts = fd.get("starts_at") as string;
    const ends = fd.get("ends_at") as string;

    const result = await updateTestMetadata({
      testId: test.id,
      title: fd.get("title"),
      description: (fd.get("description") as string) || null,
      instructions: (fd.get("instructions") as string) || null,
      duration_minutes: fd.get("duration_minutes") || null,
      starts_at: starts ? new Date(starts).toISOString() : null,
      ends_at: ends ? new Date(ends).toISOString() : null,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Saved");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={test.title}
          required
          disabled={pending || test.is_locked}
        />
        {test.is_locked && (
          <p className="text-xs text-muted-foreground">
            Locked — title cannot be changed after students have started.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={test.description ?? ""}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions (shown before start)</Label>
        <textarea
          id="instructions"
          name="instructions"
          rows={4}
          defaultValue={test.instructions ?? ""}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          disabled={pending || test.is_locked}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            min={1}
            defaultValue={test.duration_minutes ?? ""}
            disabled={pending || test.is_locked}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="starts_at">Available from (optional)</Label>
          <Input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            defaultValue={toDatetimeLocal(test.starts_at)}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ends_at">Available until (optional)</Label>
          <Input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            defaultValue={toDatetimeLocal(test.ends_at)}
            disabled={pending}
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}

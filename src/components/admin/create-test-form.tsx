"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTest } from "@/app/actions/test";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateTestForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createTest(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.data?.testId) {
      router.push(`/admin/tests/${result.data.testId}`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Test title</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="e.g. Midterm Mathematics"
          disabled={pending}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating…" : "Create draft test"}
      </Button>
    </form>
  );
}

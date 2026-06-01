"use server";

import { redirect } from "next/navigation";
import { startOrResumeAttempt } from "@/app/actions/attempt";

export async function startTestAction(testId: string) {
  const bundle = await startOrResumeAttempt(testId);
  redirect(`/tests/${testId}/attempt`);
}

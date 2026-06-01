import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { AppHeader } from "@/components/layout/app-header";
import { CreateTestForm } from "@/components/admin/create-test-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewTestPage() {
  await requireProfile("admin");

  return (
    <div className="min-h-dvh">
      <AppHeader title="New test" homeHref="/admin" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6 sm:max-w-xl">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">← Back</Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Create test</CardTitle>
            <CardDescription>
              You can add questions and publish after creating the draft.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTestForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

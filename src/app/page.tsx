import { LandingClient } from "@/components/landing/landing-client";
import { PageShell } from "@/components/layout/page-shell";

export default function LandingPage() {
  return (
    <PageShell centered className="flex min-h-dvh flex-col px-4">
      <LandingClient />
      <footer className="relative z-10 border-t border-white/[0.06] py-6 text-center text-xs text-muted-foreground">
        Momentum · exams reimagined
      </footer>
    </PageShell>
  );
}

import { PageShell } from "@/components/layout/page-shell";

export default function TestInstructionsLoading() {
  return (
    <PageShell noPadding>
      {/* Skeleton Header */}
      <div className="h-14 animate-pulse border-b border-white/[0.06] bg-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white/10" />
          <div className="space-y-1">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-3 w-20 rounded bg-white/5" />
          </div>
        </div>
        <div className="h-9 w-9 rounded-xl bg-white/10" />
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-lg px-4 py-8 pb-28 space-y-6">
        {/* Intro Card Skeleton */}
        <div className="bento-card p-6 space-y-4">
          <div className="h-8 w-48 rounded-lg bg-white/10 animate-pulse" />
          <div className="h-4 w-32 rounded bg-white/5 animate-pulse" />
          
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full rounded bg-white/10" />
            <div className="h-4 w-[95%] rounded bg-white/10" />
            <div className="h-4 w-[80%] rounded bg-white/5" />
          </div>
        </div>

        {/* Detail Cards Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bento-card p-4 space-y-2">
            <div className="h-3 w-16 rounded bg-white/5" />
            <div className="h-6 w-20 rounded bg-white/10" />
          </div>
          <div className="bento-card p-4 space-y-2">
            <div className="h-3 w-16 rounded bg-white/5" />
            <div className="h-6 w-20 rounded bg-white/10" />
          </div>
        </div>

        {/* Instructions Card Skeleton */}
        <div className="bento-card p-6 space-y-4">
          <div className="h-5 w-32 rounded bg-white/10" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-5 w-5 rounded bg-white/10 shrink-0" />
                <div className="space-y-1.5 w-full">
                  <div className="h-4 w-full rounded bg-white/10" />
                  <div className="h-4 w-[85%] rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Button Skeleton */}
        <div className="h-12 w-full rounded-xl bg-white/10 animate-pulse" />
      </div>
    </PageShell>
  );
}

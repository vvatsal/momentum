import { PageShell } from "@/components/layout/page-shell";

export default function AttemptLoading() {
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
        <div className="h-8 w-24 rounded-lg bg-white/10" />
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question area skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bento-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-28 rounded-lg bg-white/10" />
                <div className="h-6 w-16 rounded-lg bg-white/10" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full rounded bg-white/10" />
                <div className="h-4 w-[90%] rounded bg-white/10" />
                <div className="h-4 w-[75%] rounded bg-white/10" />
              </div>
            </div>

            {/* Answer Options skeleton */}
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center px-4 gap-3"
                >
                  <div className="h-5 w-5 rounded-full bg-white/10" />
                  <div className="h-4 w-48 rounded bg-white/10" />
                </div>
              ))}
            </div>

            {/* Nav buttons skeleton */}
            <div className="flex items-center justify-between pt-4">
              <div className="h-10 w-24 rounded-xl bg-white/5" />
              <div className="h-10 w-28 rounded-xl bg-white/10" />
            </div>
          </div>

          {/* Right sidebar skeleton */}
          <div className="space-y-6">
            {/* Timer card */}
            <div className="bento-card p-6 space-y-3">
              <div className="h-3 w-16 rounded bg-white/5" />
              <div className="h-8 w-28 rounded bg-white/10" />
            </div>

            {/* Question Grid card */}
            <div className="bento-card p-6 space-y-4">
              <div className="h-4 w-28 rounded bg-white/10" />
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

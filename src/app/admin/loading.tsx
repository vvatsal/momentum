import { PageShell } from "@/components/layout/page-shell";

export default function AdminLoading() {
  return (
    <PageShell noPadding>
      {/* Skeleton Header */}
      <div className="h-14 animate-pulse border-b border-white/[0.06] bg-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white/10" />
          <div className="space-y-1">
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="h-3 w-32 rounded bg-white/5" />
          </div>
        </div>
        <div className="h-9 w-9 rounded-xl bg-white/10" />
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-lg px-4 py-6 sm:max-w-2xl lg:max-w-4xl space-y-6">
        {/* Tab Menu Skeleton */}
        <div className="flex gap-2 border-b border-white/[0.06] pb-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-24 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>

        {/* Bento Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bento-card p-6 space-y-3">
              <div className="h-3 w-20 rounded bg-white/5" />
              <div className="h-10 w-16 rounded bg-white/10" />
              <div className="h-4 w-32 rounded bg-white/5 pt-2" />
            </div>
          ))}
        </div>

        {/* Content list Skeleton */}
        <div className="bento-card">
          <div className="border-b border-white/[0.06] p-6 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-24 rounded bg-white/10" />
              <div className="h-3.5 w-40 rounded bg-white/5" />
            </div>
            <div className="h-6 w-8 rounded bg-white/10" />
          </div>

          <div className="divide-y divide-white/[0.04] px-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="py-5 flex items-center justify-between gap-4 animate-pulse">
                <div className="space-y-2">
                  <div className="h-5 w-48 rounded bg-white/10" />
                  <div className="h-3.5 w-16 rounded bg-white/5" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-16 rounded-lg bg-white/5" />
                  <div className="h-8 w-16 rounded-lg bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

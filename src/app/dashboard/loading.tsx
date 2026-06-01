import { PageShell } from "@/components/layout/page-shell";

export default function DashboardLoading() {
  return (
    <PageShell noPadding>
      <div className="h-[3.75rem] animate-pulse border-b border-white/[0.06] bg-white/5" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <div className="h-16 w-48 animate-pulse rounded-xl bg-white/5" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative h-36 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]"
          >
            <div
              className="absolute inset-0 -translate-x-full animate-[shine_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          </div>
        ))}
      </div>
    </PageShell>
  );
}

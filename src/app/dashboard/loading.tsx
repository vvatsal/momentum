import { PageShell } from "@/components/layout/page-shell";

export default function DashboardLoading() {
  return (
    <PageShell noPadding>
      <div className="h-14 animate-pulse border-b border-white/[0.06] bg-white/5" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="glass h-40 animate-pulse rounded-2xl"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </PageShell>
  );
}

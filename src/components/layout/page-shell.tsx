import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
  noPadding?: boolean;
};

export function PageShell({
  children,
  className,
  centered = false,
  noPadding = false,
}: PageShellProps) {
  return (
    <div
      className={cn(
        "relative min-h-dvh",
        centered && "flex flex-col",
        className
      )}
    >
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute -right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
      </div>
      <div
        className={cn(
          "relative z-10",
          centered && "flex flex-1 flex-col",
          !noPadding && "px-4"
        )}
      >
        {children}
      </div>
    </div>
  );
}

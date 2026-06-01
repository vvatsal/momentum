import { AmbientBackground } from "@/components/motion/ambient-background";
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
        "relative min-h-dvh overflow-x-hidden",
        centered && "flex flex-col",
        className
      )}
    >
      <AmbientBackground />
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

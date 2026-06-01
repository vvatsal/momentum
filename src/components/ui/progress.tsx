"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = ({
  className,
  value,
  ...props
}: React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>) => (
  <ProgressPrimitive.Root
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-white/10",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-transform duration-300 ease-out"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
);

export { Progress };

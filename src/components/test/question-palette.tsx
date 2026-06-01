"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ResponseStatus } from "@/types/database";

export type PaletteItem = {
  questionId: string;
  index: number;
  status: ResponseStatus;
};

type QuestionPaletteProps = {
  items: PaletteItem[];
  currentQuestionId: string;
  onSelect: (questionId: string) => void;
};

export function QuestionPalette({
  items,
  currentQuestionId,
  onSelect,
}: QuestionPaletteProps) {
  const reduce = useReducedMotion();

  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
      {items.map((item) => {
        const isCurrent = item.questionId === currentQuestionId;
        return (
          <motion.button
            key={item.questionId}
            type="button"
            layout={!reduce}
            onClick={() => onSelect(item.questionId)}
            whileHover={reduce ? undefined : { scale: 1.06 }}
            whileTap={reduce ? undefined : { scale: 0.94 }}
            className={cn(
              "relative flex h-11 items-center justify-center rounded-xl text-sm font-bold transition-colors duration-200",
              isCurrent &&
                "z-10 bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-[0_0_20px_-4px_rgba(34,211,238,0.6)]",
              item.status === "answered" &&
                !isCurrent &&
                "bg-emerald-500/90 text-white shadow-md shadow-emerald-500/25",
              item.status === "skipped" &&
                !isCurrent &&
                "bg-amber-500/90 text-white",
              item.status === "unanswered" &&
                !isCurrent &&
                "border border-white/10 bg-white/5 text-muted-foreground hover:border-cyan-400/30 hover:bg-white/10"
            )}
            aria-label={`Question ${item.index + 1}, ${item.status}`}
            aria-current={isCurrent ? "true" : undefined}
          >
            {isCurrent && !reduce && (
              <motion.span
                layoutId="palette-ring"
                className="absolute inset-0 rounded-xl ring-2 ring-white/40"
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
              />
            )}
            {item.index + 1}
          </motion.button>
        );
      })}
    </div>
  );
}

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
            whileHover={reduce ? undefined : { scale: 1.1, y: -2 }}
            whileTap={reduce ? undefined : { scale: 0.9 }}
            className={cn(
              "relative flex h-10 items-center justify-center rounded-xl text-xs font-black transition-all duration-300",
              isCurrent &&
              "z-10 bg-gradient-to-br from-primary to-accent text-white shadow-[0_0_25px_-5px_hsla(190,100%,50%,0.5)]",
              item.status === "answered" &&
              !isCurrent &&
              "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
              item.status === "skipped" &&
              !isCurrent &&
              "bg-amber-500/20 text-amber-400 border border-amber-500/30",
              item.status === "unanswered" &&
              !isCurrent &&
              "bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:bg-white/[0.08] hover:border-white/20"
            )}
            aria-label={`Question ${item.index + 1}, ${item.status}`}
            aria-current={isCurrent ? "true" : undefined}
          >
            {item.index + 1}
          </motion.button>
        );
      })}
    </div>
  );
}

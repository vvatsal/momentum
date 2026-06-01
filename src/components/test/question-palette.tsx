"use client";

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
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
      {items.map((item) => {
        const isCurrent = item.questionId === currentQuestionId;
        return (
          <button
            key={item.questionId}
            type="button"
            onClick={() => onSelect(item.questionId)}
            className={cn(
              "tap-scale flex h-10 items-center justify-center rounded-xl text-sm font-bold transition-[transform,box-shadow,background] duration-150",
              isCurrent &&
                "ring-2 ring-cyan-400 ring-offset-2 ring-offset-background shadow-glow-sm scale-105",
              item.status === "answered" &&
                !isCurrent &&
                "bg-palette-answered text-white shadow-md shadow-emerald-500/20",
              item.status === "skipped" &&
                !isCurrent &&
                "bg-palette-skipped text-white",
              item.status === "unanswered" &&
                !isCurrent &&
                "border border-white/10 bg-palette-unanswered/80 text-muted-foreground hover:border-white/20",
              isCurrent &&
                item.status === "answered" &&
                "bg-palette-answered text-white",
              isCurrent &&
                item.status === "skipped" &&
                "bg-palette-skipped text-white",
              isCurrent &&
                item.status === "unanswered" &&
                "bg-gradient-to-br from-cyan-500 to-sky-500 text-white"
            )}
            aria-label={`Question ${item.index + 1}, ${item.status}`}
            aria-current={isCurrent ? "true" : undefined}
          >
            {item.index + 1}
          </button>
        );
      })}
    </div>
  );
}

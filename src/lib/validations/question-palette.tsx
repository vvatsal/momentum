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
              "flex h-10 items-center justify-center rounded-md text-sm font-medium transition-colors",
              isCurrent && "ring-2 ring-palette-current ring-offset-2",
              item.status === "answered" &&
                !isCurrent &&
                "bg-palette-answered text-white",
              item.status === "skipped" &&
                !isCurrent &&
                "bg-palette-skipped text-white",
              item.status === "unanswered" &&
                !isCurrent &&
                "bg-palette-unanswered/30 text-foreground",
              isCurrent &&
                item.status === "answered" &&
                "bg-palette-answered text-white",
              isCurrent &&
                item.status === "skipped" &&
                "bg-palette-skipped text-white",
              isCurrent &&
                item.status === "unanswered" &&
                "bg-palette-current text-white"
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

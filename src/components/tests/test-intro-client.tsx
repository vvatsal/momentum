"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, ListChecks } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { Button } from "@/components/ui/button";

type Props = {
  testId: string;
  title: string;
  description: string | null;
  instructions: string | null;
  durationMinutes: number | null;
  attemptStatus?: string;
  startForm: React.ReactNode;
};

export function TestIntroClient({
  testId,
  title,
  description,
  instructions,
  durationMinutes,
  attemptStatus,
  startForm,
}: Props) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      variants={reduce ? undefined : staggerContainer}
      initial="hidden"
      animate="show"
      className="bento-card overflow-hidden"
    >
      <div className="bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 p-6 sm:p-8">
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-muted-foreground">{description}</p>
          )}
        </motion.div>

        {instructions && (
          <motion.div
            variants={fadeUp}
            className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed whitespace-pre-wrap"
          >
            {instructions}
          </motion.div>
        )}

        <motion.ul variants={fadeUp} className="mt-5 space-y-3 text-sm">
          <li className="flex gap-3">
            <ListChecks className="h-5 w-5 shrink-0 text-cyan-400" />
            Palette navigation · auto-save on every jump
          </li>
          <li className="flex gap-3">
            <BookOpen className="h-5 w-5 shrink-0 text-violet-400" />
            Exit anytime and resume until you submit
            {durationMinutes ? ` · ~${durationMinutes} min` : ""}
          </li>
        </motion.ul>

        <motion.div variants={fadeUp} className="mt-8 space-y-3">
          {attemptStatus === "submitted" ? (
            <Button asChild className="w-full shine-btn" size="lg">
              <Link href={`/tests/${testId}/summary`}>View results</Link>
            </Button>
          ) : (
            startForm
          )}
          <Button asChild variant="ghost" className="w-full">
            <Link href="/dashboard">← Back to tests</Link>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

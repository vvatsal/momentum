"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Clock, Play, Sparkles } from "lucide-react";
import { listItem, staggerContainer } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type DashboardTest = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  attemptStatus?: string;
};

export function TestList({ tests }: { tests: DashboardTest[] }) {
  const reduce = useReducedMotion();

  if (tests.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bento-card flex flex-col items-center px-6 py-16 text-center"
      >
        <Sparkles className="mb-3 h-8 w-8 text-cyan-400/60" />
        <p className="font-medium">No tests yet</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          When your teacher publishes a test, it will show up here instantly.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.ul
      variants={reduce ? undefined : staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {tests.map((test) => {
        const status = test.attemptStatus;
        const accent =
          status === "submitted"
            ? "from-emerald-500"
            : status === "in_progress"
              ? "from-amber-400"
              : "from-cyan-400";

        return (
          <motion.li key={test.id} variants={listItem}>
            <motion.div
              whileHover={reduce ? undefined : { scale: 1.01, x: 4 }}
              whileTap={reduce ? undefined : { scale: 0.99 }}
              className="bento-card overflow-hidden"
            >
              <div
                className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${accent} to-transparent`}
              />
              <div className="p-5 pl-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold leading-snug tracking-tight">
                      {test.title}
                    </h2>
                    {test.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {test.description}
                      </p>
                    )}
                  </div>
                  {status === "in_progress" && (
                    <Badge variant="warning">In progress</Badge>
                  )}
                  {status === "submitted" && (
                    <Badge variant="success">Done</Badge>
                  )}
                  {!status && <Badge variant="default">New</Badge>}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {test.duration_minutes
                      ? `${test.duration_minutes} min`
                      : "Open time"}
                  </span>
                  <Button asChild size="sm" className="shine-btn gap-1.5">
                    <Link href={`/tests/${test.id}`}>
                      {status === "submitted" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Results
                        </>
                      ) : status === "in_progress" ? (
                        <>
                          <Play className="h-4 w-4" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Start
                        </>
                      )}
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

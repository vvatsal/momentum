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
      className="grid gap-4 sm:grid-cols-1"
    >
      {tests.map((test) => {
        const status = test.attemptStatus;
        const colorClass =
          status === "submitted" ? "text-emerald-400" :
            status === "in_progress" ? "text-amber-400" :
              "text-primary";

        return (
          <motion.li key={test.id} variants={listItem}>
            <motion.div
              whileHover={reduce ? undefined : { y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
              className="bento-card group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {status === "in_progress" && (
                        <Badge variant="warning" className="h-5">In progress</Badge>
                      )}
                      {status === "submitted" && (
                        <Badge variant="success" className="h-5">Completed</Badge>
                      )}
                      {!status && <Badge variant="default" className="h-5">New</Badge>}
                    </div>
                    <h2 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                      {test.title}
                    </h2>
                    {test.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                        {test.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {test.duration_minutes ? `${test.duration_minutes}m` : "No limit"}
                    </span>
                  </div>
                  <Button asChild size="sm" className="shine-btn rounded-xl px-6 h-9 font-semibold">
                    <Link href={`/tests/${test.id}`}>
                      {status === "submitted" ? "View Results" : status === "in_progress" ? "Resume" : "Start Test"}
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

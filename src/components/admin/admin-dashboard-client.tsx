"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { fadeUp, listItem, staggerContainer } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TestItem = {
  id: string;
  title: string;
  status: string;
};

export function AdminDashboardClient({
  studentCount,
  tests,
}: {
  studentCount: number;
  tests: TestItem[];
}) {
  const reduce = useReducedMotion();

  return (
    <>
      <motion.div
        variants={reduce ? undefined : staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3"
      >
        <motion.div variants={fadeUp} className="bento-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Students
          </p>
          <p className="mt-1 text-4xl font-black tabular-nums gradient-text">
            {studentCount}
          </p>
        </motion.div>
        <motion.div variants={fadeUp} className="bento-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tests
          </p>
          <p className="mt-1 text-4xl font-black tabular-nums gradient-text">
            {tests.length}
          </p>
        </motion.div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Button className="mt-5 w-full shine-btn sm:w-auto" size="lg" asChild>
          <Link href="/admin/tests/new">
            <Plus className="h-4 w-4" />
            Create new test
          </Link>
        </Button>
      </motion.div>

      <motion.div
        variants={reduce ? undefined : fadeUp}
        initial="hidden"
        animate="show"
        className="bento-card mt-5"
      >
        <div className="border-b border-white/[0.06] p-5">
          <h2 className="font-bold">All tests</h2>
          <p className="text-sm text-muted-foreground">Tap to edit or view reports</p>
        </div>
        {tests.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No tests yet.</p>
        ) : (
          <motion.ul
            variants={reduce ? undefined : staggerContainer}
            initial="hidden"
            animate="show"
            className="divide-y divide-white/[0.06]"
          >
            {tests.map((t) => (
              <motion.li
                key={t.id}
                variants={listItem}
                className="flex items-center justify-between gap-2 px-5 py-4"
              >
                <Link
                  href={`/admin/tests/${t.id}`}
                  className="min-w-0 flex-1 font-semibold transition-colors hover:text-cyan-400"
                >
                  {t.title}
                </Link>
                <span className="flex shrink-0 items-center gap-2">
                  {(t.status === "published" || t.status === "archived") && (
                    <Link
                      href={`/admin/tests/${t.id}/reports`}
                      className="text-xs font-semibold text-cyan-400/80 hover:text-cyan-300"
                    >
                      Reports
                    </Link>
                  )}
                  <Badge
                    variant={
                      t.status === "published"
                        ? "success"
                        : t.status === "draft"
                          ? "muted"
                          : "secondary"
                    }
                  >
                    {t.status}
                  </Badge>
                </span>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </motion.div>
    </>
  );
}

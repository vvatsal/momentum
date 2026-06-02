"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Plus, FileText, Copy, Check } from "lucide-react";
import { fadeUp, listItem, staggerContainer } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <motion.div variants={fadeUp} className="bento-card p-6 group">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Total Students
            </p>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
          </div>
          <p className="text-4xl font-black tabular-nums gradient-text">
            {studentCount}
          </p>
          <p className="mt-2 text-xs text-muted-foreground font-medium">Active learners</p>
        </motion.div>

        <motion.div variants={fadeUp} className="bento-card p-6 group">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Total Tests
            </p>
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse-glow" />
          </div>
          <p className="text-4xl font-black tabular-nums gradient-text">
            {tests.length}
          </p>
          <p className="mt-2 text-xs text-muted-foreground font-medium">Created assessments</p>
        </motion.div>

        <motion.div variants={fadeUp} className="sm:col-span-2 lg:col-span-1">
          <Link href="/admin/tests/new" className="block h-full">
            <div className="bento-card h-full p-6 flex flex-col items-center justify-center gap-3 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <p className="font-bold text-primary">Create New Test</p>
            </div>
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="bento-card mt-6 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">Bulk Upload Format</h2>
          </div>
          <CSVCopyButton />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Headers</p>
            <code className="block rounded-lg bg-white/5 p-3 text-[10px] font-mono text-primary">
              type,question,marks,options,correct_answer,explanation,tolerance
            </code>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sample MCQ</p>
            <code className="block rounded-lg bg-white/5 p-3 text-[10px] font-mono text-muted-foreground">
              mcq,"What is 2+2?",1,"4|5|6",4,"Basic math",
            </code>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={reduce ? undefined : fadeUp}
        initial="hidden"
        animate="show"
        className="bento-card mt-6"
      >
        <div className="border-b border-white/[0.06] p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">All Tests</h2>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Manage your assessments</p>
          </div>
          <Badge variant="secondary" className="font-mono">{tests.length}</Badge>
        </div>

        {tests.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">No tests created yet.</p>
          </div>
        ) : (
          <motion.ul
            variants={reduce ? undefined : staggerContainer}
            initial="hidden"
            animate="show"
            className="divide-y divide-white/[0.04]"
          >
            {tests.map((t) => (
              <motion.li
                key={t.id}
                variants={listItem}
                className="group hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center justify-between gap-4 px-6 py-5">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/tests/${t.id}`}
                      className="block font-bold text-base group-hover:text-primary transition-colors truncate"
                    >
                      {t.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge
                        variant={
                          t.status === "published"
                            ? "success"
                            : t.status === "draft"
                              ? "muted"
                              : "secondary"
                        }
                        className="h-5 text-[10px] uppercase tracking-tighter"
                      >
                        {t.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(t.status === "published" || t.status === "archived") && (
                      <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-bold text-primary hover:bg-primary/10">
                        <Link href={`/admin/tests/${t.id}/reports`}>
                          Reports
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild className="h-8 text-xs font-bold border-white/10 hover:bg-white/5">
                      <Link href={`/admin/tests/${t.id}`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </motion.div>
    </>
  );
}

function CSVCopyButton() {
  const [copied, setCopied] = useState(false);
  const sampleCsv = `type,question,marks,options,correct_answer,explanation,tolerance
mcq,"What is 2+2?",1,"4|5|6",4,"Basic math",
numeric,"Value of pi?",1,,3.14,"Constant",0.01`;

  const copy = () => {
    navigator.clipboard.writeText(sampleCsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 h-8 text-xs font-bold border-white/10 hover:bg-white/5"
      onClick={copy}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy Sample CSV
        </>
      )}
    </Button>
  );
}

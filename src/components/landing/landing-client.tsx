"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Clock,
  GraduationCap,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  fadeUp,
  scaleIn,
  staggerContainer,
} from "@/lib/motion";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Clock, label: "Per-question timer" },
  { icon: Zap, label: "Instant auto-save" },
  { icon: BarChart3, label: "Live scoring" },
];

export function LandingClient() {
  const reduce = useReducedMotion();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-10 sm:py-16">
      <motion.div
        variants={reduce ? undefined : staggerContainer}
        initial="hidden"
        animate="show"
        className="text-center"
      >
        <motion.div variants={fadeUp} className="relative mx-auto mb-8 w-fit">
          <motion.div
            className="absolute inset-0 rounded-3xl bg-cyan-400/30 blur-2xl"
            animate={reduce ? undefined : { scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 via-sky-500 to-violet-600 shadow-[0_0_60px_-10px_rgba(34,211,238,0.6)]">
            <Zap className="h-10 w-10 text-white" strokeWidth={2.5} />
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            Next-gen exams
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mt-6 text-balance text-4xl font-black tracking-tight sm:text-6xl"
        >
          Tests that feel{" "}
          <span className="gradient-text">fast</span>, not stressful
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mx-auto mt-5 max-w-lg text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Jump between questions, resume anytime, and see your score the second
          you hit submit — built for phones first.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {features.map((f, i) => (
            <motion.span
              key={f.label}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground/90"
            >
              <f.icon className="h-3.5 w-3.5 text-cyan-400" />
              {f.label}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-12 grid gap-4 sm:grid-cols-2"
        variants={reduce ? undefined : staggerContainer}
        initial="hidden"
        animate="show"
      >
        <RoleCard
          href="/login"
          icon={GraduationCap}
          title="I'm a student"
          description="Sign in with magic link or password. Take tests from your dashboard."
          cta="Enter student portal"
          gradient="from-cyan-500/20 to-sky-600/5"
          accent="cyan"
          delay={0}
        />
        <RoleCard
          href="/admin/login"
          icon={Shield}
          title="I'm an admin"
          description="Create papers, publish to class, download CSV reports."
          cta="Open admin console"
          gradient="from-violet-500/20 to-fuchsia-600/5"
          accent="violet"
          outline
          delay={0.05}
        />
      </motion.div>
    </main>
  );
}

function RoleCard({
  href,
  icon: Icon,
  title,
  description,
  cta,
  gradient,
  accent,
  outline,
  delay,
}: {
  href: string;
  icon: typeof GraduationCap;
  title: string;
  description: string;
  cta: string;
  gradient: string;
  accent: "cyan" | "violet";
  outline?: boolean;
  delay: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      variants={scaleIn}
      transition={{ delay }}
      whileHover={reduce ? undefined : { y: -6, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      className={`bento-card group bg-gradient-to-br ${gradient} p-[1px]`}
    >
      <div className="flex h-full flex-col rounded-2xl bg-[hsl(228,32%,8%)]/95 p-6 sm:p-7">
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
            accent === "cyan"
              ? "bg-cyan-500/20 text-cyan-300"
              : "bg-violet-500/20 text-violet-300"
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <Button
          asChild
          variant={outline ? "outline" : "default"}
          size="lg"
          className={`mt-6 w-full group/btn ${!outline ? "shine-btn" : ""}`}
        >
          <Link href={href}>
            {cta}
            <ArrowRight className="transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

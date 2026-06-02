"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, scaleIn } from "@/lib/motion";
import { LoginForm } from "@/components/auth/login-form";

type LoginPanelProps = {
  mode?: "student" | "admin";
  redirectTo?: string;
};

export function LoginPanel({ mode = "student", redirectTo }: LoginPanelProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={scaleIn}
      className="relative"
    >
      <motion.div
        variants={fadeUp}
        className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-transparent to-violet-500/20 blur-2xl"
      />
      <div className="relative bento-card p-6 sm:p-8">
        <motion.div variants={fadeUp}>
          <LoginForm mode={mode} redirectTo={redirectTo} />
        </motion.div>
      </div>
    </motion.div>
  );
}

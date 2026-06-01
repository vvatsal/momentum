"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { LogOut, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/auth";
import { fadeUp } from "@/lib/motion";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  homeHref: string;
}

export function AppHeader({ title, subtitle, homeHref }: AppHeaderProps) {
  const reduce = useReducedMotion();

  return (
    <motion.header
      initial={reduce ? false : "hidden"}
      animate="show"
      variants={fadeUp}
      className="sticky top-0 z-40 border-b border-white/[0.06] glass-strong"
    >
      <div className="mx-auto flex h-[3.75rem] max-w-lg items-center justify-between gap-3 px-4 sm:max-w-2xl lg:max-w-4xl">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={homeHref}
            className="group relative flex h-10 w-10 shrink-0 items-center justify-center"
            aria-label="Home"
          >
            <motion.span
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 opacity-90"
              whileHover={reduce ? undefined : { scale: 1.08, rotate: 3 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
            />
            <Zap className="relative z-10 h-4 w-4 text-white" />
          </Link>
          <div className="min-w-0">
            <Link
              href={homeHref}
              className="block truncate text-sm font-bold tracking-tight"
            >
              {title}
            </Link>
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground hover:bg-white/10 hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </motion.header>
  );
}

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
      className="sticky top-0 z-40 border-b border-white/[0.06] glass backdrop-blur-2xl"
    >
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4 sm:max-w-2xl lg:max-w-4xl">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={homeHref}
            className="group relative flex h-9 w-9 shrink-0 items-center justify-center"
            aria-label="Home"
          >
            <motion.span
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-accent opacity-90 shadow-[0_0_20px_-5px_hsla(190,100%,50%,0.5)]"
              whileHover={reduce ? undefined : { scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            />
            <Zap className="relative z-10 h-4 w-4 text-white" />
          </Link>
          <div className="min-w-0">
            <Link
              href={homeHref}
              className="block truncate text-sm font-bold tracking-tight hover:text-primary transition-colors"
            >
              {title}
            </Link>
            {subtitle && (
              <p className="truncate text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{subtitle}</p>
            )}
          </div>
        </div>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-all"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </motion.header>
  );
}

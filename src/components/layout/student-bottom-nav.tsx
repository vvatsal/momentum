"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Home, User } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/profile", label: "Profile", icon: User },
];

export function StudentBottomNav() {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] glass-strong pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg justify-around px-4 py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-6 py-2 text-xs font-medium transition-colors",
                active ? "text-cyan-300" : "text-muted-foreground"
              )}
            >
              {active && !reduce && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl bg-cyan-500/15"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="relative z-10 h-5 w-5" />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
        <div className="flex flex-col items-center gap-0.5 px-6 py-2 text-xs text-muted-foreground/50">
          <BookOpen className="h-5 w-5" />
          <span>Tests</span>
        </div>
      </div>
    </nav>
  );
}

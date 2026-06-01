"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AmbientBackground() {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div
        className="pointer-events-none fixed inset-0 bg-[#06080f]"
        aria-hidden
      />
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#06080f]" />
      <div className="absolute inset-0 bg-grid opacity-[0.35]" />
      <motion.div
        className="absolute -left-[20%] top-[-10%] h-[55vh] w-[55vh] rounded-full bg-[#22d3ee]/25 blur-[120px]"
        animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[15%] top-[20%] h-[45vh] w-[45vh] rounded-full bg-[#a855f7]/20 blur-[110px]"
        animate={{ x: [0, -35, 0], y: [0, 25, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-15%] left-[25%] h-[40vh] w-[40vh] rounded-full bg-[#3b82f6]/15 blur-[100px]"
        animate={{ x: [0, 25, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#06080f]/90" />
    </div>
  );
}

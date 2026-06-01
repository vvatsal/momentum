/** Shared Framer Motion variants — spring-based, mobile-friendly */

export const spring = {
  type: "spring" as const,
  stiffness: 420,
  damping: 32,
  mass: 0.8,
};

export const springSnappy = {
  type: "spring" as const,
  stiffness: 520,
  damping: 28,
};

export const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: spring,
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35 } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: spring },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: spring },
  exit: { opacity: 0, x: -32, transition: { duration: 0.2 } },
};

export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export const listItem = {
  hidden: { opacity: 0, x: -16, scale: 0.98 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: springSnappy,
  },
};

export const tapSpring = {
  whileTap: { scale: 0.96 },
  whileHover: { scale: 1.02 },
  transition: springSnappy,
};

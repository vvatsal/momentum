"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useQuestionTimer(active: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const visibleRef = useRef(true);

  const tick = useCallback(() => {
    if (!visibleRef.current || !active || startRef.current === null) return;
    setElapsed(
      accumulatedRef.current +
        Math.floor((Date.now() - startRef.current) / 1000)
    );
  }, [active]);

  useEffect(() => {
    if (!active) {
      startRef.current = null;
      return;
    }

    const onVisibility = () => {
      const visible = document.visibilityState === "visible";
      if (!visible && visibleRef.current && startRef.current !== null) {
        accumulatedRef.current += Math.floor(
          (Date.now() - startRef.current) / 1000
        );
        startRef.current = null;
      } else if (visible && active) {
        startRef.current = Date.now();
      }
      visibleRef.current = visible;
      tick();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [active, tick]);

  useEffect(() => {
    if (active) {
      accumulatedRef.current = 0;
      startRef.current = Date.now();
      visibleRef.current = document.visibilityState === "visible";
      setElapsed(0);
    } else {
      startRef.current = null;
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [active, tick]);

  const consumeDelta = useCallback(() => {
    let delta = elapsed;
    if (
      visibleRef.current &&
      active &&
      startRef.current !== null
    ) {
      delta =
        accumulatedRef.current +
        Math.floor((Date.now() - startRef.current) / 1000);
    }
    accumulatedRef.current = 0;
    startRef.current = active ? Date.now() : null;
    setElapsed(0);
    return delta;
  }, [active, elapsed]);

  return { elapsed, consumeDelta };
}

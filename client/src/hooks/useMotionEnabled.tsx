import { useEffect, useState } from "react";

/**
 * Enable motion only when the device supports it and the user doesn't
 * request reduced motion.
 */
export function useMotionEnabled() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const hasIntersectionObserver =
      typeof window !== "undefined" && "IntersectionObserver" in window;

    setEnabled(!prefersReduced && hasIntersectionObserver);
  }, []);

  return enabled;
}

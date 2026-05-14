import { useEffect, useState } from "react";
import { useDevDeviceMode } from "@/hooks/useDevDeviceMode";

/**
 * Enable motion only when the device supports it and the user doesn't
 * request reduced motion.
 */
export function useMotionEnabled() {
  const { mode } = useDevDeviceMode();
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const hasIntersectionObserver =
      typeof window !== "undefined" && "IntersectionObserver" in window;

    if (mode === "mobile") {
      setEnabled(false);
      return;
    }
    if (mode === "desktop") {
      setEnabled(!prefersReduced);
      return;
    }

    setEnabled(!prefersReduced && hasIntersectionObserver);
  }, [mode]);

  return enabled;
}

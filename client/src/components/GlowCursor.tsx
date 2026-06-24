import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";
import { useDevDeviceMode } from "@/hooks/useDevDeviceMode";
import { useVisualEnabled } from "@/hooks/useVisualSetting";

export default function GlowCursor() {
  const motionEnabled = useMotionEnabled();
  const { mode } = useDevDeviceMode();
  const isDesktop = mode !== "mobile";
  const enabled = useVisualEnabled("visuals.glowCursor.enabled");

  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  useEffect(() => {
    if (!motionEnabled || !isDesktop) return;

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const onLeave = () => {
      mouseX.set(-200);
      mouseY.set(-200);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [motionEnabled, isDesktop, mouseX, mouseY]);

  if (!motionEnabled || !isDesktop || !enabled) return null;

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[100]"
      style={{
        x: springX,
        y: springY,
      }}
    >
      <div className="-translate-x-1/2 -translate-y-1/2 relative">
        <div className="h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 40 60"
            className="h-16 w-auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="16" y="0" width="8" height="60" rx="3" fill="var(--primary)" opacity="0.3" />
            <rect x="0" y="18" width="40" height="8" rx="3" fill="var(--primary)" opacity="0.3" />
          </svg>
          <svg
            viewBox="0 0 40 60"
            className="absolute h-16 w-auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="17" y="2" width="6" height="56" rx="2" fill="var(--primary)" opacity="0.65" />
            <rect x="2" y="19" width="36" height="6" rx="2" fill="var(--primary)" opacity="0.65" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

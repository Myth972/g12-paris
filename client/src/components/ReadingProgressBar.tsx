import { motion, useScroll, useSpring } from "framer-motion";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";
import { useVisualEnabled } from "@/hooks/useVisualSetting";

export default function ReadingProgressBar() {
  const motionEnabled = useMotionEnabled();
  const enabled = useVisualEnabled("visuals.progressBar.enabled");

  if (!enabled) return null;
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary origin-left z-[60] shadow-[0_0_8px_rgba(var(--primary),0.4)]"
      style={{ scaleX: motionEnabled ? scaleX : undefined }}
      data-progress-bar=""
    />
  );
}

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
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/80 via-primary to-primary/80 origin-left z-[60]"
      style={{ scaleX: motionEnabled ? scaleX : undefined }}
      data-progress-bar=""
    />
  );
}

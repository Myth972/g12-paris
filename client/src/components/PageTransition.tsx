import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useVisualEnabled } from "@/hooks/useVisualSetting";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const pageTransition = {
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const [location] = useLocation();
  const enabled = useVisualEnabled("visuals.pageTransition.enabled");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location]);

  if (!enabled) return <>{children}</>;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

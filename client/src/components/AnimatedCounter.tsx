import { motion, useMotionValue, useSpring, useTransform, useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";

type Props = {
  from?: number;
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  label: string;
};

export default function AnimatedCounter({
  from = 0,
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 0.8,
  label,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const motionEnabled = useMotionEnabled();

  const raw = useMotionValue(from);
  const spring = useSpring(raw, {
    stiffness: 60,
    damping: 20,
    duration,
  });
  const display = useTransform(spring, (v) =>
    `${prefix}${v.toFixed(decimals)}${suffix}`
  );

  useEffect(() => {
    if (isInView) {
      raw.set(to);
    }
  }, [isInView, raw, to]);

  return (
    <div ref={ref} className="text-center">
      <motion.span className="text-4xl md:text-5xl font-bold font-serif text-foreground tabular-nums block">
        {motionEnabled ? display : `${prefix}${to}${suffix}`}
      </motion.span>
      <span className="text-sm text-muted-foreground mt-1 block">
        {label}
      </span>
    </div>
  );
}

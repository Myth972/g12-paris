import { useMotionEnabled } from "@/hooks/useMotionEnabled";
import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { useVisualEnabled } from "@/hooks/useVisualSetting";

type RevealVariant =
  | "fadeUp"
  | "fadeDown"
  | "fadeLeft"
  | "fadeRight"
  | "scaleUp"
  | "zoomIn"
  | "flipUp"
  | "none";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  once?: boolean;
  className?: string;
  as?: "div" | "section" | "article" | "span";
}

const variantMap: Record<RevealVariant, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  zoomIn: {
    hidden: { opacity: 0, scale: 0.6 },
    visible: { opacity: 1, scale: 1 },
  },
  flipUp: {
    hidden: { opacity: 0, rotateX: 45, y: 30 },
    visible: { opacity: 1, rotateX: 0, y: 0 },
  },
  none: {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 18 },
  },
};

export function Reveal({
  children,
  variant = "fadeUp",
  delay = 0,
  duration = 0.5,
  once = true,
  className,
  as = "div",
  ...props
}: RevealProps) {
  const motionEnabled = useMotionEnabled();
  const revealEnabled = useVisualEnabled("visuals.reveal.enabled");
  const MotionTag = motion[as as keyof typeof motion] as any;

  if (!motionEnabled || !revealEnabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <MotionTag
      className={className}
      variants={variantMap[variant]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-60px" }}
      transition={{ duration, delay, ease: "easeOut" }}
      {...props}
    >
      {children}
    </MotionTag>
  );
}

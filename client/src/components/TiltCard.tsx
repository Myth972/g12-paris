import { useMotionEnabled } from "@/hooks/useMotionEnabled";
import { useRef, useCallback, type ReactNode } from "react";
import { useVisualEnabled } from "@/hooks/useVisualSetting";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  shine?: boolean;
  as?: "div" | "article";
}

export default function TiltCard({
  children,
  className = "",
  maxTilt = 12,
  perspective = 1000,
  scale = 1.02,
  shine = true,
  as = "div",
}: TiltCardProps) {
  const motionEnabled = useMotionEnabled();
  const tiltEnabled = useVisualEnabled("visuals.tiltCard.enabled");
  const cardRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);

  const canTilt = motionEnabled && tiltEnabled;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!canTilt) return;
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      card.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;

      if (shine && shineRef.current) {
        const shineX = (x / rect.width) * 100;
        const shineY = (y / rect.height) * 100;
        shineRef.current.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;
        shineRef.current.style.opacity = "1";
      }
    },
    [canTilt, maxTilt, perspective, scale, shine]
  );

  const handleMouseLeave = useCallback(() => {
    if (!canTilt) return;
    const card = cardRef.current;
    if (card) {
      card.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    }
    if (shine && shineRef.current) {
      shineRef.current.style.opacity = "0";
    }
  }, [canTilt, perspective, shine]);

  if (!canTilt) {
    return <div className={className}>{children}</div>;
  }

  const Tag = as;

  return (
    <Tag
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
        transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {shine && (
        <div
          ref={shineRef}
          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 z-10"
          style={{ mixBlendMode: "overlay" }}
        />
      )}
    </Tag>
  );
}

import { useEffect, useRef } from "react";
import { useVisualEnabled, useVisualSetting } from "@/hooks/useVisualSetting";

type ParticleShape = "circle" | "star";

interface FloatingParticlesProps {
  className?: string;
  particleCount?: number;
  color?: string;
  speed?: number;
  interactive?: boolean;
  shape?: ParticleShape;
}

function drawStarPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  rotation: number,
) {
  const points = 5;
  const step = Math.PI / points;

  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = rotation + i * step - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export default function FloatingParticles({
  className = "",
  particleCount: pc,
  color: clr,
  speed: spd,
  interactive = true,
  shape = "circle",
}: FloatingParticlesProps) {
  const enabled = useVisualEnabled("visuals.particles.enabled");
  const countFromSettings = useVisualSetting("visuals.particles.count");
  const colorFromSettings = useVisualSetting("visuals.particles.color");
  const speedFromSettings = useVisualSetting("visuals.particles.speed");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const particleCount = pc ?? (Number(countFromSettings) || 50);
  const color = clr || colorFromSettings || "#FCD34D";
  const speed = spd ?? (Number(speedFromSettings) || 0.3);

  if (!enabled) return null;
  const miceRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const computedColor =
      color ||
      getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim() || "#8B5CF6";

    let animId = 0;
    let particles: Particle[] = [];

    const resize = () => {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
      initParticles();
    };

    const mouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      miceRef.current.x = e.clientX - rect.left;
      miceRef.current.y = e.clientY - rect.top;
    };

    const mouseLeave = () => {
      miceRef.current.x = -1000;
      miceRef.current.y = -1000;
    };

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      pulse: number;
      rotation: number;
      rotSpeed: number;

      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = shape === "star" ? Math.random() * 3 + 2 : Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * speed * 0.3;
        this.speedY = -(Math.random() * speed * 0.8 + 0.2);
        this.opacity = Math.random() * 0.5 + 0.2;
        this.pulse = Math.random() * Math.PI * 2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.02;
      }

      update(w: number, h: number) {
        this.pulse += 0.01;
        this.rotation += this.rotSpeed;
        this.x += this.speedX + Math.sin(this.pulse) * 0.15;
        this.y += this.speedY;

        if (this.y < -10) {
          this.y = h + 10;
          this.x = Math.random() * w;
        }
        if (this.x < -10) this.x = w + 10;
        if (this.x > w + 10) this.x = -10;
      }

      draw(ctx: CanvasRenderingContext2D, color: string, mouseX: number, mouseY: number) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const glow = dist < 120 ? (1 - dist / 120) * 0.6 : 0;

        const pulseOpacity = this.opacity + Math.sin(this.pulse) * 0.1;
        const finalOpacity = Math.min(pulseOpacity + glow, 0.9);
        const r = this.size + glow * 3;

        if (shape === "star") {
          const innerR = r * 0.4;
          drawStarPath(ctx, this.x, this.y, r, innerR, this.rotation);
          ctx.fillStyle = color;
          ctx.globalAlpha = finalOpacity;
          ctx.fill();

          if (glow > 0) {
            drawStarPath(ctx, this.x, this.y, r * 2.5, r * 1, this.rotation);
            ctx.fillStyle = color;
            ctx.globalAlpha = glow * 0.2;
            ctx.fill();
          }
        } else {
          ctx.beginPath();
          ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = finalOpacity;
          ctx.fill();

          if (glow > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, r * 3, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.globalAlpha = glow * 0.25;
            ctx.fill();
          }
        }

        ctx.globalAlpha = 1;
      }
    }

    function initParticles() {
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      particles = Array.from({ length: particleCount }, () => new Particle(w, h));
    }

    function drawConnections(ctx: CanvasRenderingContext2D, color: string) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = color;
            ctx.globalAlpha = (1 - dist / 120) * 0.08;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    function animate() {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const { x: mx, y: my } = miceRef.current;

      for (const p of particles) {
        p.update(w, h);
        p.draw(ctx, computedColor, mx, my);
      }

      drawConnections(ctx, computedColor);

      animId = requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", mouseMove as EventListener);
    canvas.addEventListener("mouseleave", mouseLeave);

    resize();
    animate();

    rafRef.current = animId;

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      if (canvas) {
        canvas.removeEventListener("mousemove", mouseMove as EventListener);
        canvas.removeEventListener("mouseleave", mouseLeave);
      }
    };
  }, [particleCount, color, speed, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * FloatingVignette — Vignettes d'images flottantes
 *  ✦ Animation de lévitation sinusoïdale (framer-motion animate)
 *  ✦ Parallaxe magnétique lié au curseur (useSpring LERP)
 *  ✦ Layouts : "trio" (3 images, règle du triangle) | "duo" (2 images)
 *  ✦ Mobile : parallaxe désactivé (@media hover:none)
 *  ✦ Accessibilité : prefers-reduced-motion supporté
 */

import { useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export interface VignetteImage {
  src: string;
  alt: string;
  title?: string;
}

interface PlaneConfig {
  /** vitesse du parallaxe (0 = immobile, 1 = suit le curseur 1:1) */
  speedX: number;
  speedY: number;
  /** durée de la lévitation CSS en secondes */
  floatDuration: number;
  /** délai négatif pour désynchroniser les plans */
  floatDelay: number;
  /** Amplitude de la lévitation en px */
  floatAmplitude: number;
  zIndex: number;
  /** largeur de l'image en px (desktop) */
  width: number;
  /** position : valeurs CSS appliquées au wrapper absolu */
  top: string;
  left?: string;
  right?: string;
  xOffset?: string; // translateX supplémentaire (ex: "-50%" pour centrer)
}

// ─── Configurations de plans ────────────────────────────────────────────────

const TRIO_PLANES: PlaneConfig[] = [
  {
    // Gauche : léger, rapide, derrière
    speedX: 0.25,
    speedY: 0.2,
    floatDuration: 4.2,
    floatDelay: 0,
    floatAmplitude: 12,
    zIndex: 1,
    width: 240,
    top: "50%",
    left: "4%",
    xOffset: "0%",
  },
  {
    // Centre : dominant, lent, devant
    speedX: 0.08,
    speedY: 0.06,
    floatDuration: 5.5,
    floatDelay: -1.2,
    floatAmplitude: 18,
    zIndex: 3,
    width: 320,
    top: "44%",
    left: "50%",
    xOffset: "-50%",
  },
  {
    // Droite : intermédiaire
    speedX: 0.35,
    speedY: 0.28,
    floatDuration: 3.9,
    floatDelay: -2.1,
    floatAmplitude: 10,
    zIndex: 2,
    width: 210,
    top: "56%",
    right: "4%",
    xOffset: "0%",
  },
];

const DUO_PLANES: PlaneConfig[] = [
  {
    // Gauche : légèrement plus haut, mouvement rapide
    speedX: 0.4,
    speedY: 0.35,
    floatDuration: 4.0,
    floatDelay: 0,
    floatAmplitude: 14,
    zIndex: 2,
    width: 270,
    top: "44%",
    left: "10%",
    xOffset: "0%",
  },
  {
    // Droite : plus grande, mouvement lent = premier plan
    speedX: 0.15,
    speedY: 0.12,
    floatDuration: 5.2,
    floatDelay: -1.8,
    floatAmplitude: 18,
    zIndex: 3,
    width: 310,
    top: "56%",
    right: "10%",
    xOffset: "0%",
  },
];

// ─── Composant enfant pour un plan ──────────────────────────────────────────

function FloatItem({
  image,
  cfg,
  wrapperRef,
  reducedMotion,
  isMobile,
}: {
  image: VignetteImage;
  cfg: PlaneConfig;
  wrapperRef: React.RefObject<HTMLDivElement>;
  reducedMotion: boolean;
  isMobile: boolean;
}) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 70, damping: 16, mass: 0.5 });
  const springY = useSpring(rawY, { stiffness: 70, damping: 16, mass: 0.5 });

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (reducedMotion || isMobile) return;
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      rawX.set((e.clientX - cx) * cfg.speedX);
      rawY.set((e.clientY - cy) * cfg.speedY);
    },
    [reducedMotion, isMobile, cfg.speedX, cfg.speedY, rawX, rawY, wrapperRef]
  );

  const onMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);
    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [wrapperRef, onMouseMove, onMouseLeave]);

  // ─── Positionnement statique (pas de framer-motion ici) ───────────────────
  // On utilise un div CSS pur pour top/left/right + translateX,
  // puis des motion.div enfants pour les transforms animés.
  const outerStyle: React.CSSProperties = {
    position: "absolute",
    top: cfg.top,
    zIndex: cfg.zIndex,
    willChange: "transform",
    ...(cfg.left !== undefined ? { left: cfg.left } : {}),
    ...(cfg.right !== undefined ? { right: cfg.right } : {}),
    // translateX CSS pur pour le centrage horizontal (ex: -50%)
    transform: cfg.xOffset ? `translateX(${cfg.xOffset}) translateY(-50%)` : "translateY(-50%)",
  };

  return (
    // Couche 1 : positionnement statique (CSS pur)
    <div style={outerStyle}>
      {/* Couche 2 : parallaxe horizontal (framer-motion x) */}
      <motion.div style={{ x: reducedMotion || isMobile ? 0 : springX }}>
        {/* Couche 3 : lévitation + parallaxe vertical (framer-motion y) */}
        <motion.div
          style={{ y: reducedMotion || isMobile ? 0 : springY }}
          initial={{ y: -cfg.floatAmplitude / 2 }}
          animate={reducedMotion ? {} : { y: cfg.floatAmplitude / 2 }}
          transition={{
            duration: cfg.floatDuration,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror",
            delay: Math.abs(cfg.floatDelay),
          }}
        >
          <div className="relative group cursor-default select-none">
            <img
              src={image.src}
              alt={image.alt}
              width={cfg.width}
              height={Math.round(cfg.width * 0.75)}
              loading="lazy"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                width: cfg.width,
                height: Math.round(cfg.width * 0.75),
                objectFit: "cover",
                borderRadius: 16,
                boxShadow:
                  "0 24px 56px rgba(0,0,0,0.22), 0 8px 20px rgba(0,0,0,0.12)",
                display: "block",
              }}
            />
            {image.title && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  borderRadius: "0 0 16px 16px",
                  padding: "8px 12px",
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
                }}
              >
                <p
                  style={{
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: "center",
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {image.title}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function FloatingVignette({
  images,
  layout,
  className = "",
}: {
  images: VignetteImage[];
  layout?: "trio" | "duo";
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const reducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const isMobile =
    typeof window !== "undefined"
      ? window.matchMedia("(hover: none)").matches
      : false;

  const resolvedLayout: "trio" | "duo" =
    layout ?? (images.length >= 3 ? "trio" : "duo");

  const planes = resolvedLayout === "trio" ? TRIO_PLANES : DUO_PLANES;
  const displayImages = images.slice(0, planes.length);

  // Hauteur du wrapper : assez grande pour accueillir les images + amplitude
  const wrapperH = isMobile
    ? 300
    : resolvedLayout === "trio"
      ? 460
      : 400;

  return (
    <div
      ref={wrapperRef}
      id={`vignette-${resolvedLayout}`}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: wrapperH,
        overflow: "visible",
      }}
      aria-label="Galerie d'images flottantes"
    >
      {displayImages.map((image, idx) => (
        <FloatItem
          key={idx}
          image={image}
          cfg={planes[idx]}
          wrapperRef={wrapperRef as React.RefObject<HTMLDivElement>}
          reducedMotion={reducedMotion}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
}

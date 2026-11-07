import { motion, useReducedMotion } from "framer-motion";

/**
 * Signature animée « LÉO » — tracé manuscrit SVG animé par Framer Motion.
 *
 *  - Chaque trait (L, corps du É, accent aigu, O) se dessine séquentiellement
 *    au scroll (whileInView, une seule fois).
 *  - prefers-reduced-motion : rendu statique (tous les traits visibles,
 *    aucune animation) — même convention que Reveal.
 *  - Décoratif : aria-hidden, la couleur suit currentColor du parent
 *    (text-primary dans Home, opacité gérée côté parent aussi).
 *
 * Le tracé est dessiné à la main (paths) et non issue d'une police :
 * rendu déterministe quel que soit l'OS/la police du visiteur.
 */

// viewBox 160×92 — traits partagés entre les lettres pour un style cursive.
const SIGNATURE_PATHS = [
  // L manuscrit : hampe descendante puis remontée en boucle
  "M14 10 C10 30 8 52 14 68 C20 80 34 78 44 66 C50 58 54 50 56 44",
  // É (corps) : double courbe façon epsilon cursive
  "M70 30 C62 36 60 48 68 54 C60 60 60 72 70 76 C78 80 88 76 92 70",
  // Accent aigu du É, posé en dernier geste sur la lettre
  "M74 16 C78 10 86 5 93 3",
  // O : boucle ovale fermée
  "M120 28 C106 34 104 52 112 66 C120 78 138 78 146 66 C154 54 152 36 140 30 C133 26 124 26 120 28",
] as const;

const STROKE_PROPS = {
  stroke: "currentColor",
  strokeWidth: 3.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export default function AnimatedSignature({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 160 92" fill="none" className="w-full h-auto select-none">
        {SIGNATURE_PATHS.map((d, i) =>
          reduced ? (
            <path key={d} d={d} {...STROKE_PROPS} />
          ) : (
            <motion.path
              key={d}
              d={d}
              {...STROKE_PROPS}
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{
                pathLength: { duration: 0.9, delay: i * 0.45, ease: "easeInOut" },
                opacity: { duration: 0.2, delay: i * 0.45 },
              }}
            />
          )
        )}
      </svg>
    </div>
  );
}

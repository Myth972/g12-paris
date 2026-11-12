import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Signature animée — le texte vient du réglage `visuals.signature.text`
 * (défaut « G12 Paris »).
 *
 * Le rendu manuscrit ne repose pas sur des tracés figés mais sur une police
 * cursive locale : n'importe quel texte peut donc être signé.
 *
 *  - révélation de gauche à droite (clip-path), puis paraphe tracé dessous ;
 *  - déclenchement quand le bloc arrive dans le viewport, pas au chargement :
 *    la signature est le dernier élément d'une page très longue, l'animation
 *    serait terminée avant qu'on l'atteigne ;
 *  - écoute `scroll` plutôt qu'IntersectionObserver : ce dernier laissait le
 *    bloc bloqué à `opacity: 0` (arrivée directe en bas de page, section
 *    jamais vue à 60 %) ;
 *  - `prefers-reduced-motion` : tout est affiché d'emblée, sans animation.
 *
 * La police « G12 Signature » (Dancing Script 600, SIL OFL 1.1) est
 * auto-hébergée dans `client/public/fonts/` et déclarée dans `index.css` : le
 * rendu est donc identique sur tous les appareils. La pile conserve des
 * polices locales puis `cursive` en repli si le fichier ne charge pas.
 */

const SCRIPT_FONT =
  '"G12 Signature", "Segoe Script", "Bradley Hand", "Brush Script MT", "Lucida Handwriting", cursive';

// Paraphe : courbe qui s'élargit puis se relève, étirée à la largeur du texte.
const PARAPHE = "M4 8 C40 2 90 2 120 6 C150 10 178 8 196 4";

const TEXT_HIDDEN = { clipPath: "inset(0 100% 0 0)", opacity: 0 };
const TEXT_VISIBLE = { clipPath: "inset(0 0% 0 0)", opacity: 1 };
const PARAPHE_HIDDEN = { pathLength: 0, opacity: 0 };
const PARAPHE_VISIBLE = { pathLength: 1, opacity: 1 };

/** Durée de l'écriture du texte, puis du paraphe (secondes). */
const TEXT_DURATION = 2.4;
const PARAPHE_DELAY = 2.5;
const PARAPHE_DURATION = 0.9;

export default function AnimatedSignature({
  className,
  text,
}: {
  className?: string;
  text?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  // Un texte vide retombe sur la valeur par défaut : sans texte, il n'y a
  // plus de signature à afficher.
  const label = text?.trim() || "G12 Paris";
  const show = Boolean(reduced) || revealed;

  useEffect(() => {
    const check = () => {
      const el = ref.current;
      if (!el) return;
      // Déjà au-dessus du bord bas du viewport (le bloc est visible, ou la
      // page a été ouverte directement en bas) : on révèle sans attendre.
      if (el.getBoundingClientRect().top < window.innerHeight - 40) {
        setRevealed(true);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <div className={className} ref={ref}>
      <div className="inline-block">
        <motion.p
          style={{ fontFamily: SCRIPT_FONT, fontWeight: 600 }}
          className="text-center text-3xl sm:text-4xl leading-tight whitespace-nowrap"
          initial={TEXT_HIDDEN}
          animate={show ? TEXT_VISIBLE : TEXT_HIDDEN}
          transition={{ duration: TEXT_DURATION, ease: "easeInOut" }}
        >
          {label}
        </motion.p>
        <svg
          viewBox="0 0 200 12"
          fill="none"
          aria-hidden="true"
          preserveAspectRatio="none"
          className="w-full h-2 mt-1"
        >
          <motion.path
            d={PARAPHE}
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            initial={PARAPHE_HIDDEN}
            animate={show ? PARAPHE_VISIBLE : PARAPHE_HIDDEN}
            transition={{
              pathLength: { duration: PARAPHE_DURATION, delay: PARAPHE_DELAY },
              opacity: { duration: 0.2, delay: PARAPHE_DELAY },
            }}
          />
        </svg>
      </div>
    </div>
  );
}

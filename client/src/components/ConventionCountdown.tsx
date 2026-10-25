import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";

interface ConventionCountdownProps {
  /** ISO locale (ex. datetime-local) ou ISO UTC du début de l'événement */
  startISO: string;
  /** ISO locale ou UTC de la fin de l'événement (pour l'état « en cours ») */
  endISO?: string;
  className?: string;
  /** Texte au-dessus des cellules (défaut : « J- avant la Convention ») */
  label?: string;
  /** Texte affiché pendant l'événement (défaut : message Convention) */
  liveLabel?: string;
  /** Variante compacte pour les cartes : une ligne « 12j 04h 30m 00s » */
  compact?: boolean;
}

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Compte à rebours jusqu'au début d'un événement.
 * Utilisé par la page Convention et par les cartes d'événements (`compact`).
 * - Avant le début : compteur jours / heures / minutes / secondes.
 * - Pendant l'événement : bannière « C'est en ce moment ! ».
 * - Après la fin : ne rend rien.
 */
export default function ConventionCountdown({
  startISO,
  endISO,
  className,
  label = "J- avant la Convention",
  liveLabel = "C'est en ce moment ! Rejoignez la Convention",
  compact = false,
}: ConventionCountdownProps) {
  const motionEnabled = useMotionEnabled();
  const start = new Date(startISO).getTime();
  const end = endISO ? new Date(endISO).getTime() : start + 3 * 24 * 3600 * 1000;

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!Number.isFinite(start)) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [start]);

  if (!Number.isFinite(start) || now >= end) return null;

  if (now >= start) {
    // Événement en cours
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={
          className ??
          "inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 text-white text-base font-bold shadow-lg shadow-red-600/25 animate-pulse"
        }
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
        {liveLabel}
      </motion.div>
    );
  }

  const diff = Math.max(0, start - now);
  const parts: Parts = {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
  };

  const cells = [
    { value: parts.days, label: parts.days > 1 ? "Jours" : "Jour" },
    { value: parts.hours, label: parts.hours > 1 ? "Heures" : "Heure" },
    { value: parts.minutes, label: parts.minutes > 1 ? "Minutes" : "Minute" },
    { value: parts.seconds, label: parts.seconds > 1 ? "Secondes" : "Seconde" },
  ];

  // Variante compacte (cartes d'événements) : chips inline « 12j 04h 30m 00s »
  const compactUnits = ["j", "h", "m", "s"];
  if (compact) {
    return (
      <div
        className={className ?? "inline-flex items-center justify-center gap-1 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 shadow-sm"}
        role="timer"
      >
        {cells.map((cell, i) => (
          <span key={cell.label} className="tabular-nums leading-none" aria-hidden={i > 0 ? "true" : undefined}>
            <span className="text-base font-bold font-serif text-foreground">
              {String(cell.value).padStart(2, "0")}
            </span>
            <span className="text-[9px] font-semibold uppercase text-muted-foreground mr-0.5">
              {compactUnits[i]}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
      className={className}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
        {label}
      </p>
      <div className="flex items-stretch justify-center gap-2 sm:gap-3" role="timer" aria-live="off">
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="flex flex-col items-center min-w-[68px] sm:min-w-[80px] px-2 py-3 rounded-2xl bg-white dark:bg-card border border-border/60 shadow-sm"
          >
            <motion.span
              key={cell.value}
              initial={motionEnabled ? { y: -6, opacity: 0.4 } : false}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl sm:text-3xl font-bold font-serif text-foreground tabular-nums"
            >
              {String(cell.value).padStart(2, "0")}
            </motion.span>
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">
              {cell.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

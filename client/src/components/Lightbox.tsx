import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Plus, Minus, Maximize2, Quote, BookOpen } from "lucide-react";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";
import { getImageUrl } from "@/lib/imageUrl";

/* Élément affichable dans la lightbox : image, vidéo locale ou YouTube */
export interface LightboxItem {
  type?: string;
  mediaUrl?: string;
  youtubeUrl?: string;
  coverImageUrl?: string;
  title?: string;
  loop?: boolean;
  verse?: { text: string; reference: string; summary?: string } | null;
  category?: string;
}

interface LightboxProps {
  items: LightboxItem[];
  /** Index de l'élément ouvert ; null = lightbox fermée */
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

const ZOOM_STEP = 1.5;
const ZOOM_MAX = 5;

/**
 * Lightbox plein écran :
 * - Zoom : molette, double-clic, boutons +/-/réinitialiser
 * - Pan : glisser lorsqu'un média est zoomé
 * - Swipe mobile : glisser horizontalement pour passer au média suivant/précédent
 * - Clavier : Échap fermer, ← / → naviguer
 */
export default function Lightbox({ items, index, onClose, onIndexChange }: LightboxProps) {
  const motionEnabled = useMotionEnabled();
  const item = index !== null ? items[index] : null;
  const open = !!item;

  const [scale, setScale] = useState(1);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      const next = (index + delta + items.length) % items.length;
      setDirection(delta);
      setScale(1);
      onIndexChange(next);
    },
    [index, items.length, onIndexChange]
  );

  const zoomBy = useCallback((factor: number) => {
    setScale((s) => Math.min(ZOOM_MAX, Math.max(1, s * factor)));
  }, []);

  // Verrouille le scroll de la page tant que la lightbox est ouverte
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Navigation clavier
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, go]);

  // Zoom à la molette (listener non-passif pour preventDefault autorisé)
  useEffect(() => {
    const node = containerRef.current;
    if (!node || !open) return;
    const onWheel = (e: WheelEvent) => {
      if (!item || item.type !== "image") return;
      e.preventDefault();
      setScale((s) => {
        const next = e.deltaY < 0 ? s * 1.1 : s / 1.1;
        return Math.min(ZOOM_MAX, Math.max(1, next));
      });
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [open, item]);

  // Reset de l'état à la fermeture
  useEffect(() => {
    if (!open) {
      setScale(1);
      setDirection(0);
    }
  }, [open]);

  if (!open || !item) return null;

  const isImage = item.type === "image";
  const isVideo = item.type !== "image" && item.mediaUrl && !item.youtubeUrl;
  const isYoutube = item.type !== "image" && !!item.youtubeUrl;
  const thumb = item.coverImageUrl || null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={motionEnabled ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Barre supérieure : titre + outils de zoom + fermeture */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-base font-serif font-semibold text-white truncate">
              {item.title}
            </p>
            <p className="text-[10px] sm:text-xs text-white/60">
              {index! + 1} / {items.length}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {isImage && (
              <>
                <button
                  type="button"
                  aria-label="Dézoomer"
                  title="Dézoomer (-)"
                  className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  onClick={() => zoomBy(1 / ZOOM_STEP)}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Zoomer"
                  title="Zoomer (+)"
                  className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  onClick={() => zoomBy(ZOOM_STEP)}
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Réinitialiser le zoom"
                  title="Taille réelle (double-clic)"
                  className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  onClick={() => setScale(1)}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              type="button"
              aria-label="Fermer"
              title="Fermer (Échap)"
              className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Zone média : swipe horizontal (molette = zoom sur image) */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={`${item.title}-${item.mediaUrl ?? item.youtubeUrl ?? "img"}-${index}`}
              custom={direction}
              initial={motionEnabled ? { opacity: 0, x: direction * 80 } : false}
              animate={{ opacity: 1, x: 0 }}
              exit={motionEnabled ? { opacity: 0, x: direction * -80 } : { opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center p-3 sm:p-6 pb-0"
            >
              <motion.div
                // Image : swipe x quand dézoomé, pan libre quand zoomé
                drag={isImage ? (scale > 1 ? true : "x") : false}
                // Zoomé : pan libre (borné au conteneur) — dézoomé : élastique horizontal borné
                dragConstraints={scale > 1 ? containerRef : { left: -140, right: 140 }}
                dragElastic={scale > 1 ? 0.1 : 0.25}
                dragSnapToOrigin={scale <= 1}
                onDragEnd={(_, info) => {
                  if (scale > 1 || !isImage) return;
                  if (info.offset.x < -90) go(1);
                  else if (info.offset.x > 90) go(-1);
                }}
                onDoubleClick={() => setScale((s) => (s > 1 ? 1 : 2.5))}
                style={{ scale }}
                className="max-w-full max-h-full cursor-grab active:cursor-grabbing select-none"
              >
                {isImage && (
                  <img
                    src={getImageUrl(item.mediaUrl ?? "")}
                    alt={item.title || "Image"}
                    draggable={false}
                    decoding="async"
                    className="max-h-[70vh] sm:max-h-[76vh] w-auto max-w-full rounded-xl shadow-2xl"
                  />
                )}
                {isVideo && (
                  <video
                    src={getImageUrl(item.mediaUrl ?? "")}
                    controls
                    playsInline
                    loop={item.loop}
                    className="max-h-[70vh] sm:max-h-[76vh] w-auto max-w-full rounded-xl shadow-2xl"
                  />
                )}
                {isYoutube && (
                  <div className="w-[min(90vw,960px)] aspect-video rounded-xl overflow-hidden shadow-2xl">
                    <YouTubeEmbed url={item.youtubeUrl!} />
                  </div>
                )}
                {!isImage && !isVideo && !isYoutube && thumb && (
                  <img
                    src={thumb}
                    alt={item.title || "Média"}
                    draggable={false}
                    decoding="async"
                    className="max-h-[70vh] max-w-full rounded-xl shadow-2xl"
                  />
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Flèches de navigation (desktop + tactile) */}
          {items.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Média précédent"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 inline-flex w-10 h-10 sm:w-12 sm:h-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors z-10"
                onClick={() => go(-1)}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                aria-label="Média suivant"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 inline-flex w-10 h-10 sm:w-12 sm:h-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors z-10"
                onClick={() => go(1)}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Verset biblique éventuel + catégorie (bas de la lightbox) */}
        {(item.verse || (item.category && item.category !== "general")) && (
          <div className="shrink-0 px-4 sm:px-6 py-3 max-h-[26vh] overflow-y-auto">
            {item.verse && (
              <div className="mx-auto max-w-2xl rounded-xl bg-gradient-to-br from-amber-950/40 to-blue-950/30 border border-amber-200/20 p-4 text-center">
                <p className="text-sm sm:text-base italic font-serif text-white/90 leading-relaxed">
                  « {item.verse.text} »
                </p>
                <p className="mt-1 text-xs font-bold text-amber-400">{item.verse.reference}</p>
                {item.verse.summary && (
                  <p className="mt-2 text-xs text-white/60 leading-relaxed italic">
                    {item.verse.summary}
                  </p>
                )}
              </div>
            )}
            {item.category && item.category !== "general" && (
              <p className="mt-2 text-center text-xs text-white/50 flex items-center justify-center gap-1.5">
                <BookOpen className="w-3 h-3" />
                {item.category === "foi" && "🙏 Foi"}
                {item.category === "louange" && "🎵 Louange"}
                {item.category === "esperance" && "✨ Espérance"}
              </p>
            )}
          </div>
        )}
        {!item.verse && <Quote className="hidden" />}
      </motion.div>
    </AnimatePresence>
  );
}

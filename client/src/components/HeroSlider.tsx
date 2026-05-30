import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Slide {
  imageUrl: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  textColor?: string;
  titleColor?: string;
}

interface HeroSliderProps {
  slides: Slide[];
  autoPlayInterval?: number;
  className?: string;
}

export default function HeroSlider({
  slides,
  autoPlayInterval = 5000,
  className = "",
}: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number) => {
      setCurrent((index + slides.length) % slides.length);
    },
    [slides.length]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const id = setInterval(next, autoPlayInterval);
    return () => clearInterval(id);
  }, [next, autoPlayInterval, slides.length, isPaused]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) next();
      else prev();
    }
    setIsPaused(false);
  }, [next, prev]);

  const titleRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const subtitleRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    titleRefs.current.forEach((el: HTMLHeadingElement | null, i: number) => {
      if (!el) return;
      const slide = slides[i];
      if (slide?.titleColor) {
        el.style.setProperty("color", slide.titleColor, "important");
      } else {
        el.style.setProperty("color", "white", "important");
      }
    });
    subtitleRefs.current.forEach((el: HTMLParagraphElement | null, i: number) => {
      if (!el) return;
      const slide = slides[i];
      if (slide?.textColor) {
        el.style.setProperty("color", slide.textColor, "important");
        el.style.setProperty("text-shadow", "0 0 8px rgba(0,0,0,0.7), 0 0 3px rgba(255,255,255,0.3)", "important");
      } else {
        el.style.color = "rgba(255,255,255,0.9)";
        el.style.textShadow = "";
      }
    });
  }, [slides]);

  if (slides.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-lg bg-muted touch-pan-y ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Slider d'actualités"
    >
      {/* Slides container */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
             <div
               key={i}
               className="relative w-full flex-shrink-0 aspect-[16/9] max-sm:aspect-[4/3] min-h-[280px] max-sm:min-h-[340px] bg-muted flex items-center justify-center overflow-hidden group"
             >
            {/* Background image */}
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading={i === 0 ? "eager" : "lazy"}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
             {/* Content */}
             <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6">
                <h2 ref={el => { titleRefs.current[i] = el; }} className="text-white text-[1.15rem] sm:text-lg md:text-2xl lg:text-3xl xl:text-4xl font-bold font-serif leading-[1.15] max-w-2xl drop-shadow-lg mb-2 sm:mb-3">
                 {slide.title}
               </h2>
               {slide.subtitle && (
                  <p ref={el => { subtitleRefs.current[i] = el; }} className="text-[0.825rem] sm:text-base md:text-lg leading-[1.6] mt-2 sm:mt-2.5 max-w-xl whitespace-pre-line">
                   {slide.subtitle}
                 </p>
               )}
               {slide.ctaLabel && slide.ctaHref && (
                  <Button
                    asChild
                    size="sm"
                    className="mt-3 sm:mt-4 md:mt-5 bg-white text-black hover:bg-white/90 border-0 rounded-full px-4 sm:px-6 shadow-lg text-xs sm:text-sm md:text-base font-semibold h-8 sm:h-9"
                  >
                    <a href={slide.ctaHref}>{slide.ctaLabel}</a>
                  </Button>
               )}
             </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all backdrop-blur-sm touch-manipulation"
            aria-label="Slide précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all backdrop-blur-sm touch-manipulation"
            aria-label="Slide suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 max-sm:w-28">
          <div className="h-1 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-700 ease-out"
              style={{ width: `${((current + 1) / slides.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

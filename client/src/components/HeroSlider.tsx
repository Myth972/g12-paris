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
        el.style.color = "rgba(255,255,255,0.8)";
        el.style.textShadow = "";
      }
    });
  }, [slides]);

  if (slides.length === 0) return null;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg bg-muted ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
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
            className="relative w-full flex-shrink-0 aspect-[21/9] min-h-[160px] md:min-h-[260px] bg-muted flex items-center justify-center overflow-hidden"
          >
            {/* Background image */}
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-contain"
              loading={i === 0 ? "eager" : "lazy"}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6">
              <h2 ref={el => { titleRefs.current[i] = el; }} className="text-white text-sm sm:text-lg md:text-2xl lg:text-3xl font-bold font-serif leading-tight max-w-2xl drop-shadow-lg">
                {slide.title}
              </h2>
              {slide.subtitle && (
                <p ref={el => { subtitleRefs.current[i] = el; }} className="text-[11px] sm:text-xs md:text-sm mt-1 sm:mt-1.5 max-w-xl whitespace-pre-line">
                  {slide.subtitle}
                </p>
              )}
              {slide.ctaLabel && slide.ctaHref && (
                <Button
                  asChild
                  size="sm"
                  className="mt-1.5 sm:mt-2 md:mt-3 bg-white text-black hover:bg-white/90 border-0 rounded-full px-3 sm:px-4 shadow-lg text-[10px] sm:text-xs h-7 sm:h-8"
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

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 touch-manipulation ${
                i === current
                  ? "bg-white w-4"
                  : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Aller au slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

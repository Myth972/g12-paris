import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PublicationCarousel() {
  const { data, isLoading } = trpc.publications.list.useQuery();
  
  const publications = data || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const imagePublications = publications?.filter((pub: any) => pub.type === 'image') || [];

  useEffect(() => {
    if (imagePublications.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [imagePublications.length, currentIndex]);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % imagePublications.length);
      setIsTransitioning(false);
    }, 500);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + imagePublications.length) % imagePublications.length);
      setIsTransitioning(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-muted animate-pulse rounded-lg" />
    );
  }

  if (imagePublications.length === 0) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Aucune publication pour le moment</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 overflow-hidden rounded-lg shadow-lg">
      {imagePublications.map((pub: any, index: number) => {
        const isActive = index === currentIndex;
        const isPrevious = index === (currentIndex - 1 + imagePublications.length) % imagePublications.length;
        
        return (
          <div
            key={pub.id}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              isActive 
                ? 'opacity-100 scale-100 z-10' 
                : isPrevious 
                  ? 'opacity-0 scale-105 z-0' 
                  : 'opacity-0 scale-100 z-0'
            }`}
          >
            <img
              src={pub.content}
              alt={pub.title || 'Publication du jour'}
              className="w-full h-full object-cover"
            />
            
            {pub.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h3 className="text-white font-serif text-2xl font-semibold">
                  {pub.title}
                </h3>
                <p className="text-white/80 text-sm mt-1">
                  {new Date(pub.createdAt).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={prevSlide}
        disabled={isTransitioning}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={nextSlide}
        disabled={isTransitioning}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {imagePublications.map((_: any, index: number) => (
          <button
            key={index}
            onClick={() => {
              if (isTransitioning) return;
              setIsTransitioning(true);
              setTimeout(() => {
                setCurrentIndex(index);
                setIsTransitioning(false);
              }, 300);
            }}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            disabled={isTransitioning}
            aria-label={`Aller à la publication ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
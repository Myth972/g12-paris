import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Exemples d'images pour la galerie
const GALLERY_IMAGES = [
    {
        src: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070&auto=format&fit=crop",
        alt: "Galerie 1",
    },
    {
        src: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=1974&auto=format&fit=crop",
        alt: "Galerie 2",
    },
    {
        src: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop",
        alt: "Galerie 3",
    },
    {
        src: "https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=2070&auto=format&fit=crop",
        alt: "Galerie 4",
    },
    {
        src: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop",
        alt: "Galerie 5",
    },
    {
        src: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?q=80&w=2070&auto=format&fit=crop",
        alt: "Galerie 6",
    },
];

export default function Galeries() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    return (
        <div className="container mx-auto py-8 space-y-8">
            <Helmet>
                <title>Galeries Photos - G12 Paris</title>
                <meta name="description" content="Parcourez nos galeries photos des événements et moments forts de G12 Paris." />
            </Helmet>
            <h1 className="text-3xl font-bold text-center mb-8">Galeries d'Images</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {GALLERY_IMAGES.map((image, index) => (
                    <Card
                        key={index}
                        className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
                        onClick={() => setSelectedImage(image.src)}
                    >
                        <CardContent className="p-2">
                            <AspectRatio ratio={4 / 3} className="bg-muted rounded-md overflow-hidden">
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="object-cover w-full h-full hover:scale-110 transition-transform duration-300"
                                />
                            </AspectRatio>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
                    <DialogTitle className="sr-only">Image Zoom</DialogTitle>
                    <div className="relative">
                        {selectedImage && (
                            <img
                                src={selectedImage}
                                alt="Zoomed"
                                className="w-full h-auto rounded-lg shadow-2xl"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

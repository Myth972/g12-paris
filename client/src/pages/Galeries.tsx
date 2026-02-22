import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon } from "lucide-react";
import AdminQuickEdit from "@/components/AdminQuickEdit";

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
    const { data: galleryItems, isLoading } = trpc.galleries.list.useQuery();
    const { data: pageInfo } = trpc.pages.getBySlug.useQuery({ slug: "galeries" });

    const images = galleryItems && galleryItems.length > 0 ? galleryItems : GALLERY_IMAGES;
    const title = pageInfo?.title || "Galeries d'Images";
    const description = pageInfo?.description || "Découvrez les moments forts de notre communauté à travers ces clichés.";

    return (
        <div className="min-h-screen">
            <AdminQuickEdit tab="gallery" label="Gérer les photos de la galerie" />
            <div className="container mx-auto py-8 space-y-8">
                <Helmet>
                    <title>{title} - G12 Paris</title>
                    <meta name="description" content={description} />
                </Helmet>

                <div className="text-center space-y-2 mb-10">
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">{title}</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        {description}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                            </div>
                        ))
                    ) : images.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Aucune image dans la galerie pour le moment.</p>
                        </div>
                    ) : (
                        images.map((image, index) => (
                            <Card
                                key={(image as any).id || index}
                                className="group cursor-pointer overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300"
                                onClick={() => setSelectedImage(image.src)}
                            >
                                <CardContent className="p-0">
                                    <AspectRatio ratio={4 / 3} className="bg-muted overflow-hidden">
                                        <img
                                            src={image.src}
                                            alt={image.alt || ""}
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
                                    </AspectRatio>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                    <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
                        <DialogTitle className="sr-only">Image Zoom</DialogTitle>
                        <DialogDescription className="sr-only">
                            Agrandissement de l'image sélectionnée.
                        </DialogDescription>
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
        </div>
    );
}

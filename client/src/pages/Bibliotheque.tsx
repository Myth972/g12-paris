import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, BookOpen } from "lucide-react";
import AdminQuickEdit from "@/components/AdminQuickEdit";

// Images d'exemple de livres bibliques
const BIBLICAL_BOOKS = [
    {
        id: 1,
        title: "Genèse",
        description: "Le premier livre de la Bible",
        src: "https://images.unsplash.com/photo-150784272343-583f20270319?q=80&w=2070&auto=format&fit=crop",
        alt: "Genèse",
    },
    {
        id: 2,
        title: "Exode",
        description: "La libération du peuple d'Israël",
        src: "https://images.unsplash.com/photo-1516979187457-635afe062eaf?q=80&w=2070&auto=format&fit=crop",
        alt: "Exode",
    },
    {
        id: 3,
        title: "Psaumes",
        description: "Cantiques et prières",
        src: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop",
        alt: "Psaumes",
    },
    {
        id: 4,
        title: "Proverbes",
        description: "Sagesse et enseignements",
        src: "https://images.unsplash.com/photo-1507842715763-b5a000fcb237?q=80&w=2070&auto=format&fit=crop",
        alt: "Proverbes",
    },
    {
        id: 5,
        title: "Matthieu",
        description: "Évangile selon Matthieu",
        src: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2070&auto=format&fit=crop",
        alt: "Matthieu",
    },
    {
        id: 6,
        title: "Marc",
        description: "Évangile selon Marc",
        src: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop",
        alt: "Marc",
    },
    {
        id: 7,
        title: "Luc",
        description: "Évangile selon Luc",
        src: "https://images.unsplash.com/photo-1507842715763-b5a000fcb237?q=80&w=2070&auto=format&fit=crop",
        alt: "Luc",
    },
    {
        id: 8,
        title: "Jean",
        description: "Évangile selon Jean",
        src: "https://images.unsplash.com/photo-1516979187457-635afe062eaf?q=80&w=2070&auto=format&fit=crop",
        alt: "Jean",
    },
    {
        id: 9,
        title: "Actes",
        description: "Les actes des apôtres",
        src: "https://images.unsplash.com/photo-1507843550913-e06fb8db3737?q=80&w=2070&auto=format&fit=crop",
        alt: "Actes",
    },
];

export default function Bibliotheque() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const { data: galleryItems, isLoading } = trpc.galleries.list.useQuery();
    const { data: pageInfo } = trpc.pages.getBySlug.useQuery({ slug: "bibliotheque" });

    const images = galleryItems && galleryItems.length > 0 ? galleryItems : BIBLICAL_BOOKS;
    const title = pageInfo?.title || "Bibliothèque";
    const description = pageInfo?.description || "Explorez notre collection de ressources bibliques et spirituelles.";

    return (
        <div className="min-h-screen">
            <AdminQuickEdit tab="gallery" label="Gérer les livres de la galerie biblique" />
            <Helmet>
                <title>{title} - G12 Paris</title>
                <meta name="description" content={description} />
            </Helmet>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-orange-600 to-orange-800 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex justify-center mb-4">
                        <BookOpen className="w-16 h-16" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
                        {title}
                    </h1>
                    <p className="text-xl text-orange-100 max-w-2xl mx-auto">
                        {description}
                    </p>
                </div>
            </section>

            {/* Info Box */}
            <div className="bg-orange-50 border-t border-b border-orange-200 py-8">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-orange-600 mb-2">
                                {BIBLICAL_BOOKS.length}+
                            </div>
                            <p className="text-orange-800">Livres bibliques disponibles</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-orange-600 mb-2">
                                📚
                            </div>
                            <p className="text-orange-800">Ressources spirituelles</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-orange-600 mb-2">
                                🎯
                            </div>
                            <p className="text-orange-800">Enseignements bibliques</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Galerie Biblique */}
            <div className="container mx-auto py-12 space-y-8">
                <div>
                    <h2 className="text-3xl font-serif font-bold mb-2 text-foreground">
                        Galerie Biblique
                    </h2>
                    <p className="text-muted-foreground">
                        Découvrez les principaux livres et ressources bibliques
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-full" />
                            </div>
                        ))
                    ) : images.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Aucune image dans la galerie pour le moment.</p>
                        </div>
                    ) : (
                        images.map((book: any, index) => (
                            <Card
                                key={book.id || index}
                                className="group cursor-pointer overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col"
                                onClick={() => {
                                    setSelectedImage(book.src);
                                    setSelectedBook(book);
                                }}
                            >
                                <CardContent className="p-0 flex-1 flex flex-col">
                                    <AspectRatio ratio={3 / 4} className="bg-muted overflow-hidden">
                                        <img
                                            src={book.src}
                                            alt={book.alt || book.title}
                                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                                    </AspectRatio>
                                    <div className="p-4 flex-1 flex flex-col justify-end">
                                        <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                            {book.title}
                                        </h3>
                                        {book.description && (
                                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                                {book.description}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Modal pour images agrandies */}
            <Dialog open={!!selectedImage} onOpenChange={() => {
                setSelectedImage(null);
                setSelectedBook(null);
            }}>
                <DialogContent className="max-w-4xl p-0 bg-background border-none shadow-2xl">
                    <DialogTitle className="sr-only">
                        {selectedBook?.title || "Image Zoom"}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Agrandissement de l'image sélectionnée.
                    </DialogDescription>
                    <div className="relative grid md:grid-cols-3 gap-0">
                        {selectedImage && (
                            <>
                                <div className="md:col-span-2">
                                    <img
                                        src={selectedImage}
                                        alt="Zoomed"
                                        className="w-full h-auto max-h-[600px] object-cover"
                                    />
                                </div>
                                {selectedBook && (
                                    <div className="p-6 bg-card border-l border-border flex flex-col justify-center">
                                        <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
                                            {selectedBook.title}
                                        </h2>
                                        {selectedBook.description && (
                                            <p className="text-muted-foreground mb-6 leading-relaxed">
                                                {selectedBook.description}
                                            </p>
                                        )}
                                        <div className="mt-auto pt-6 border-t border-border">
                                            <button
                                                onClick={() => {
                                                    setSelectedImage(null);
                                                    setSelectedBook(null);
                                                }}
                                                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                Fermer
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <style>{`
                .absolute {
                    position: absolute;
                }
                .inset-0 {
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                }
            `}</style>
        </div>
    );
}

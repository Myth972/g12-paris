import React, { useMemo } from 'react';
import { trpc } from "@/lib/trpc";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Calendar, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaPlayer } from "@/components/MediaPlayer";
import { EditableText, EditableSection } from "@/components/EditableText";
import { toast } from "sonner";
import { useState } from "react";

/**
 * Utilitaire: Formater une date
 */
function formatDateFR(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Utilitaire: Obtenir la date d'hier
 */
function getYesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Utilitaire: Vérifier si deux dates sont le même jour
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function Publications() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = getYesterday();

  const { data: publications, isLoading } = trpc.publications.list.useQuery();
  const uploadMutation = trpc.media.upload.useMutation();
  const createMutation = trpc.publications.create.useMutation();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Trouver les publications du jour et du jour précédent
  const todayPublications = useMemo(() => {
    return publications?.filter(pub => isSameDay(new Date(pub.createdAt), today)) || [];
  }, [publications]);

  const yesterdayPublications = useMemo(() => {
    return publications?.filter(pub => isSameDay(new Date(pub.createdAt), yesterday)) || [];
  }, [publications]);

  // Images du jour et du jour précédent
  const todayImage = todayPublications.find(p => p.type === 'image' || p.content.endsWith('.jpg') || p.content.endsWith('.png'));
  const yesterdayImage = yesterdayPublications.find(p => p.type === 'image' || p.content.endsWith('.jpg') || p.content.endsWith('.png'));

  // Vidéo du jour (MP4 ou YouTube)
  const todayVideo = todayPublications.find(p => 
    p.content.includes('youtube') || 
    p.content.includes('youtu.be') || 
    p.content.endsWith('.mp4')
  );

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string)?.split(',')[1];

        const result = await uploadMutation.mutateAsync({
          base64,
          filename: selectedFile.name,
          contentType: selectedFile.type,
          prefix: 'publications'
        });

        const isVideo = selectedFile.type.startsWith('video/') || selectedFile.name.endsWith('.mp4');
        const isYouTube = selectedFile.name.includes('youtube') || selectedFile.name.includes('youtu.be');

        await createMutation.mutateAsync({
          type: isVideo ? 'video' : 'image',
          content: result.url,
          title: `Publication du ${new Date().toLocaleDateString('fr-FR')}`,
        });

        toast.success("Publication créée avec succès!");
        setSelectedFile(null);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error("Erreur lors de la création de la publication");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Publication du jour - G12 Paris</title>
        <meta name="description" content="Découvrez les publications quotidiennes de G12 Paris." />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <EditableText
            value="Publication du jour"
            pageId="publications"
            fieldName="heroTitle"
            as="h1"
            className="text-4xl md:text-5xl font-serif font-bold mb-4"
          />
          <EditableText
            value="Découvrez les images et vidéos du jour"
            pageId="publications"
            fieldName="heroSubtitle"
            as="p"
            className="text-xl text-blue-100 max-w-2xl mx-auto"
          />
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        
        {/* Upload Section (Admin) */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-serif font-bold text-blue-900">
              Ajouter une publication
            </h2>
          </div>
          
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*,video/*,.mp4"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="text-sm text-blue-700">
              {selectedFile ? `Fichier sélectionné: ${selectedFile.name}` : 'Sélectionnez une image ou vidéo'}
            </p>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full sm:w-auto"
            >
              {isUploading ? "Téléchargement..." : "Créer la publication"}
            </Button>
          </div>
        </div>

        {/* Main Display: 2 Images + 1 Video */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column: Images */}
          <div className="lg:col-span-1 space-y-6">
            {/* Image du jour */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-serif font-bold text-foreground">
                  Image du jour
                </h3>
              </div>
              {isLoading ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="aspect-square bg-muted animate-pulse" />
                  </CardContent>
                </Card>
              ) : todayImage ? (
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <img
                      src={todayImage.content || ''}
                      alt={todayImage.title || 'Image'}
                      className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center aspect-square">
                    <div className="text-center text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune image aujourd'hui</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Image du jour précédent */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-serif font-bold text-foreground">
                  Image du jour précédent
                </h3>
              </div>
              {isLoading ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="aspect-square bg-muted animate-pulse" />
                  </CardContent>
                </Card>
              ) : yesterdayImage ? (
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <img
                      src={yesterdayImage.content || ''}
                      alt={yesterdayImage.title || 'Image'}
                      className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center aspect-square">
                    <div className="text-center text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune image hier</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Column: Video */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-serif font-bold text-foreground">
                Vidéo du jour
              </h3>
            </div>

            {isLoading ? (
              <Card>
                <CardContent className="p-0">
                  <div className="w-full aspect-video bg-muted animate-pulse" />
                </CardContent>
              </Card>
            ) : todayVideo ? (
              <MediaPlayer
                url={todayVideo.content || ''}
                title={todayVideo.title || 'Vidéo du jour'}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center text-muted-foreground">
                    <AlertCircle className="w-16 h-16 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">Aucune vidéo disponible</p>
                    <p className="text-sm mt-2">Téléchargez une vidéo MP4 ou un lien YouTube</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* All Publications History */}
        <div>
          <h2 className="text-3xl font-serif font-bold mb-8 text-foreground">
            Toutes les publications
          </h2>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
                  <div className="aspect-square bg-muted" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : publications && publications.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {publications.slice(0, 12).map((pub: any) => (
                <Card key={pub.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {pub.type === 'image' || pub.content.endsWith('.jpg') || pub.content.endsWith('.png') ? (
                    <CardContent className="p-0">
                      <img
                        src={pub.content}
                        alt={pub.title}
                        className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </CardContent>
                  ) : (
                    <CardContent className="flex items-center justify-center aspect-square bg-muted">
                      <div className="text-center text-muted-foreground">
                        <AlertCircle className="w-8 h-8 mx-auto opacity-50" />
                        <p className="text-xs mt-1">Vidéo</p>
                      </div>
                    </CardContent>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base line-clamp-2">
                      {pub.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(pub.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Aucune publication</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

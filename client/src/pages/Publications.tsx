// Exemple rapide d'upload
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const handleImageUpload = async (file: File) => {
  // Note: Cette route S3 n'existe pas dans le routeur tRPC
  // Utiliser media.upload à la place
  /* Exemple d'utilisation:
  const { url, key } = await trpc.media.upload.mutate({
    base64: await file.arrayBuffer().then(buf => Buffer.from(buf).toString('base64')),
    filename: file.name,
    contentType: file.type,
    prefix: 'publications'
  });
  */
};

export default function Publications() {
  const { data: publications, isLoading } = trpc.publications.list.useQuery();
  const uploadMutation = trpc.media.upload.useMutation();
  const createMutation = trpc.publications.create.useMutation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string)?.split(',')[1];
        
        const result = await uploadMutation.mutateAsync({
          base64,
          filename: selectedFile.name,
          contentType: selectedFile.type,
          prefix: 'publications'
        });

        await createMutation.mutateAsync({
          type: 'image',
          content: result.url,
          title: `Publication du ${new Date().toLocaleDateString('fr-FR')}`,
        });

        toast.success("Publication créée avec succès!");
        setSelectedFile(null);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error("Erreur lors de la création de la publication");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Publications</h1>
      
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Créer une publication</h2>
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="block"
          />
          <Button 
            onClick={handleUpload}
            disabled={!selectedFile || createMutation.isPending}
          >
            {createMutation.isPending ? "Création en cours..." : "Créer la publication"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p>Chargement...</p>
        ) : publications && publications.length > 0 ? (
          publications.map((pub: any) => (
            <div key={pub.id} className="bg-card border border-border rounded-lg overflow-hidden">
              {pub.type === 'image' && (
                <img src={pub.content} alt={pub.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <h3 className="font-semibold">{pub.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {new Date(pub.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>Aucune publication</p>
        )}
      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Helmet } from "react-helmet-async";

export default function Publications() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Helmet>
        <title>Publications du Jour - G12 Paris</title>
        <meta name="description" content="Découvrez les publications, images et versets du jour sélectionnés par G12 Paris Infos Médias." />
      </Helmet>
      <h1 className="text-3xl font-bold text-center mb-8">Publications du Jour</h1>

      {/* Section Images */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Images du Jour</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4">
              <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070&auto=format&fit=crop"
                  alt="Publication 1"
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                />
              </AspectRatio>
              <p className="mt-2 text-muted-foreground text-center">Légende de l'image 1</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=1974&auto=format&fit=crop"
                  alt="Publication 2"
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                />
              </AspectRatio>
              <p className="mt-2 text-muted-foreground text-center">Légende de l'image 2</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Résumé Biblique */}
      <section className="bg-primary/5 rounded-lg p-6 md:p-8">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-semibold text-primary">Verset du Jour</h2>
          <blockquote className="text-xl italic font-serif text-foreground/80">
            "Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l'espérance."
          </blockquote>
          <cite className="block font-semibold text-muted-foreground">- Jérémie 29:11</cite>
          <div className="pt-4 text-left text-muted-foreground">
            <h3 className="text-lg font-semibold text-foreground mb-2">Résumé Biblique</h3>
            <p>
              Ce verset nous rappelle que Dieu a un plan bienveillant pour chacun de nous. Même dans les moments d'incertitude ou de difficulté, nous pouvons avoir confiance que sa volonté est de nous apporter la paix et un avenir plein d'espoir. C'est une invitation à la confiance et à la foi en sa providence divine.
            </p>
          </div>
        </div>
      </section>

      {/* Section Vidéos YouTube */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Vidéos à la Une</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vidéo 1</CardTitle>
            </CardHeader>
            <CardContent>
              <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </AspectRatio>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vidéo 2</CardTitle>
            </CardHeader>
            <CardContent>
              <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
                <iframe
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </AspectRatio>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

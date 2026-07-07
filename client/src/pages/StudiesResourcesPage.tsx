import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Play, Calendar, Download } from "lucide-react";

export default function StudiesResourcesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary/5 py-16 border-b">
        <div className="container text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 mb-4 justify-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              Ressources
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-6 text-foreground">Études & Ressources Spirituelles</h1>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
            Approfondissez votre foi avec nos guides d'étude, plans de lecture, vidéos et ressources téléchargeables gratuites.
          </p>
        </div>
      </section>

      {/* Main Categories */}
      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Guides d'étude */}
            <div className="bg-card border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <BookOpen size={28} />
              </div>
              <h2 className="text-2xl font-serif font-bold mb-4">Guides d'Étude Biblique</h2>
              <p className="text-muted-foreground mb-6">
                Des manuels complets pour étudier les livres de la Bible en profondeur, seul ou en groupe.
              </p>
              <div className="space-y-4 mb-8">
                {["L'Évangile de Jean - Étude approfondie", "Épître aux Romains - Comprendre la grâce", "Les Psaumes - Prier avec la Bible"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer border border-transparent hover:border-border">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full rounded-xl">Voir tous les guides</Button>
            </div>

            {/* Plans de lecture */}
            <div className="bg-card border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-6">
                <Calendar size={28} />
              </div>
              <h2 className="text-2xl font-serif font-bold mb-4">Plans de Lecture</h2>
              <p className="text-muted-foreground mb-6">
                Structurez votre temps de méditation avec nos plans thématiques ou chronologiques.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { title: "La Bible en 1 an", duration: "365 jours" },
                  { title: "Découvrir la vie de Jésus", duration: "30 jours" },
                  { title: "Vaincre l'anxiété par la Parole", duration: "14 jours" }
                ].map((plan, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer border border-transparent hover:border-border">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{plan.title}</span>
                    </div>
                    <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{plan.duration}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full rounded-xl">Explorer les plans</Button>
            </div>

          </div>
        </div>
      </section>

      {/* Ressources gratuites (PDF & Vidéos) */}
      <section className="py-16 bg-muted/30 border-t">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-serif mb-4">Ressources Gratuites</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Téléchargez des fiches pratiques ou regardez nos vidéos de formation pour vous accompagner au quotidien.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* PDFs */}
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText className="text-primary" /> Fiches Pratiques & PDF
              </h3>
              <div className="space-y-4">
                {[
                  { title: "Comment étudier sa Bible efficacement", size: "1.2 Mo" },
                  { title: "Méthode d'étude inductive O.I.A.", size: "850 Ko" },
                  { title: "Chronologie de l'Ancien Testament", size: "2.5 Mo" },
                  { title: "Guide de prière pour la famille", size: "1.8 Mo" }
                ].map((pdf, i) => (
                  <div key={i} className="flex items-center justify-between bg-card p-4 rounded-xl border hover:border-primary/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold group-hover:text-primary transition-colors">{pdf.title}</h4>
                        <p className="text-xs text-muted-foreground">Document PDF • {pdf.size}</p>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary hover:text-white transition-all" aria-label="Télécharger">
                      <Download className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Vidéos */}
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Play className="text-red-500 fill-current" /> Vidéos Explicatives
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: "Introduction aux Psaumes", duration: "12:45" },
                  { title: "Comment utiliser une concordance", duration: "08:20" },
                  { title: "Comprendre le contexte historique", duration: "15:30" },
                  { title: "Les prophéties messianiques", duration: "22:10" }
                ].map((video, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="aspect-video bg-slate-800 rounded-xl relative overflow-hidden mb-3">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 text-white fill-white ml-1" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium">
                        {video.duration}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">{video.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

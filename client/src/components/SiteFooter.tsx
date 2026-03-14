import { Newspaper } from "lucide-react";
import { Link } from "wouter";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-primary-foreground mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif">G12 Paris</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/60 font-medium">
                  infos médias
                </p>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed max-w-xs">
              Votre source d'information de confiance sur l'actualité parisienne
              et nationale.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80 mb-4 font-sans">
              Rubriques
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Actualités", href: "/categorie/actualité" },
                {
                  label: "Publication du jour",
                  href: "/categorie/publication du jour",
                },
                { label: "Galeries", href: "/galeries" },
                { label: "Culte en ligne", href: "/categorie/culte en ligne" },
                { label: "Bibliothèque", href: "/categorie/bibliothèque" },
              ].map(cat => (
                <li key={cat.href}>
                  <Link
                    href={cat.href}
                    className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80 mb-4 font-sans">
              Informations
            </h4>
            <ul className="space-y-2 text-sm text-primary-foreground/60">
              <li>Paris, France</li>
              <li>contact@g12paris.fr</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center">
          <p className="text-xs text-primary-foreground/50">
            &copy; {year} G12 Paris infos médias. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

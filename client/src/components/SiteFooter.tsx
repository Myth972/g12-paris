import { Newspaper, Mail, Send } from "lucide-react";
import { Link } from "wouter";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import PageTextEditor from "@/components/PageTextEditor";
export default function SiteFooter() {
  const year = new Date().getFullYear();
  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () =>
      toast.success("Merci pour votre inscription à la newsletter !"),
    onError: e => toast.error(e.message || "Erreur lors de l'inscription"),
  });

  return (
    <footer className="bg-foreground text-primary-foreground mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-3">
              <span className="g12-logo">
                <img
                  src="/logo.png"
                  alt="G12 Paris Médias"
                  className="h-10 w-10 rounded-full object-cover border border-primary-foreground/20"
                />
              </span>
              <div>
                <h3 className="text-base font-bold font-serif">G12 Paris</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/60 font-medium">
                  infos médias
                </p>
              </div>
            </Link>
            <PageTextEditor
              pageKey="global"
              textKey="footer-blurb"
              defaultText="Votre source d'information de confiance sur l'actualité parisienne et nationale."
              className="text-sm text-primary-foreground/70 leading-relaxed max-w-xs"
            />
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80 mb-4 font-sans">
              Rubriques
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Accueil", href: "/" },
                { label: "Publication du jour", href: "/publication-du-jour" },
                { label: "Galeries", href: "/galeries" },
                { label: "Culte en ligne", href: "/culte-en-ligne" },
                { label: "Bibliothèque", href: "/bibliotheque" },
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

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80 mb-4 font-sans flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Newsletter
            </h4>
            <p className="text-sm text-primary-foreground/90 mb-4">
              Restez informé de nos derniers ajouts et publications.
            </p>
            <form
              onSubmit={e => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const email = fd.get("email") as string;
                if (email) {
                  subscribeMutation.mutate({ email });
                  e.currentTarget.reset();
                }
              }}
              className="flex items-center gap-2"
            >
              <Input
                type="email"
                name="email"
                placeholder="Votre adresse email"
                className="bg-primary-foreground/10 border-none text-primary-foreground placeholder:text-primary-foreground/70 w-full"
                required
              />
              <Button
                type="submit"
                variant="default"
                size="icon"
                disabled={subscribeMutation.isPending}
                className="bg-primary text-white hover:bg-primary/90 shadow-md transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
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

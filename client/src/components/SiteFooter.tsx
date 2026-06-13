import { Newspaper, Mail, Send } from "lucide-react";
import { Link } from "wouter";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import PageTextEditor from "@/components/PageTextEditor";
import { useTranslation } from "react-i18next";
export default function SiteFooter() {
  const { t } = useTranslation();
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
                  src="/logo.webp"
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
              {t('footer.sections', 'Rubriques')}
            </h4>
            <ul className="space-y-2">
              {[
                { labelKey: "nav.home", defaultLabel: "Accueil", href: "/" },
                { labelKey: "nav.dailyPost", defaultLabel: "Publication du jour", href: "/publication-du-jour" },
                { labelKey: "nav.galleries", defaultLabel: "Galeries", href: "/galeries" },
                { labelKey: "nav.onlineService", defaultLabel: "Culte en ligne", href: "/culte-en-ligne" },
                { labelKey: "nav.library", defaultLabel: "Bibliothèque", href: "/bibliotheque" },
              ].map(cat => (
                <li key={cat.href}>
                  <Link
                    href={cat.href}
                    className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {t(cat.labelKey, cat.defaultLabel)}
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
              {t('footer.newsletterDesc', 'Restez informé de nos derniers ajouts et publications.')}
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
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <Input
                type="email"
                name="email"
                placeholder={t('footer.emailPlaceholder', 'Votre adresse email')}
                className="bg-primary-foreground/10 border-none text-primary-foreground placeholder:text-primary-foreground/70 w-full h-11"
                required
              />
              <Button
                type="submit"
                variant="default"
                className="w-full sm:w-auto h-11 px-4 bg-primary text-white hover:bg-primary/90 shadow-md transition-all active:scale-95"
                disabled={subscribeMutation.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center">
          <p className="text-xs text-primary-foreground/50">
            {t('footer.copyright', `© ${year} G12 Paris infos médias. Tous droits réservés.`)}
          </p>
        </div>
      </div>
    </footer>
  );
}

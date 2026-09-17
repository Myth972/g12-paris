import { Mail, Send, Facebook, Instagram, Youtube, MapPin, Phone } from "lucide-react";
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
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const s = settingsQuery.data || {};

  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () =>
      toast.success("Merci pour votre inscription à la newsletter !"),
    onError: e => toast.error(e.message || "Erreur lors de l'inscription"),
  });

  const brandTitle = (s["footer.brandTitle"] as string) || "G12 Paris";
  const brandSubtitle = (s["footer.brandSubtitle"] as string) || "infos médias";
  const brandTagline = (s["footer.brandTagline"] as string) || "Votre source d'information de confiance sur l'actualité parisienne et nationale.";

  const sectionsTitle = (s["footer.sectionsTitle"] as string) || t('footer.sections', 'Rubriques');
  const newsletterTitle = (s["footer.newsletterTitle"] as string) || "Newsletter";
  const newsletterDesc = (s["footer.newsletterDesc"] as string) || t('footer.newsletterDesc', 'Restez informé de nos derniers ajouts et publications.');
  const emailPlaceholder = (s["footer.emailPlaceholder"] as string) || t('footer.emailPlaceholder', 'Votre adresse email');

  const contactAddress = (s["footer.contactAddress"] as string) || "";
  const contactPhone = (s["footer.contactPhone"] as string) || "";

  const facebookUrl = (s["footer.facebookUrl"] as string) || "https://www.facebook.com/G12France/";
  const instagramUrl = (s["footer.instagramUrl"] as string) || "https://www.instagram.com/cci.paris/";
  const youtubeUrl = (s["footer.youtubeUrl"] as string) || "https://www.youtube.com/@media.mpecciparis";

  const copyright = (s["footer.copyright"] as string) || t('footer.copyright', `© ${year} G12 Paris infos médias. Tous droits réservés.`);

  const socialLinks = [
    { href: facebookUrl, icon: <Facebook className="w-4 h-4" />, label: "Facebook" },
    { href: instagramUrl, icon: <Instagram className="w-4 h-4" />, label: "Instagram" },
    { href: youtubeUrl, icon: <Youtube className="w-4 h-4" />, label: "YouTube" },
  ];

  // Liens essentiels uniquement (footer épuré)
  const links = [
    { labelKey: "nav.home", defaultLabel: "Accueil", href: "/" },
    { labelKey: "nav.dailyPost", defaultLabel: "Publication du jour", href: "/publication-du-jour" },
    { labelKey: "nav.galleries", defaultLabel: "Galeries", href: "/galeries" },
    { labelKey: "nav.events", defaultLabel: "Événements", href: "/evenements" },
    { labelKey: "nav.library", defaultLabel: "Bibliothèque", href: "/bibliotheque" },
    { labelKey: "nav.vision", defaultLabel: "À propos", href: "/bibliotheque/vision" },
  ];

  return (
    <footer className="bg-foreground text-primary-foreground mt-auto">
      <div className="container py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="g12-logo">
                <img
                  src="/logo.webp"
                  alt="G12 Paris Médias"
                  className="h-9 w-9 rounded-full object-cover border border-primary-foreground/20"
                />
              </span>
              <div>
                <h3 className="text-sm font-bold font-serif leading-tight">{brandTitle}</h3>
                <p className="text-[9px] uppercase tracking-[0.2em] text-primary-foreground/60 font-medium">
                  {brandSubtitle}
                </p>
              </div>
            </Link>
            <PageTextEditor
              pageKey="global"
              textKey="footer-blurb"
              defaultText={brandTagline}
              className="text-[13px] text-primary-foreground/70 leading-relaxed max-w-xs"
            />

            {(contactAddress || contactPhone) && (
              <div className="space-y-1.5 pt-1">
                {contactAddress && (
                  <p className="flex items-start gap-1.5 text-[13px] text-primary-foreground/60">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span className="whitespace-pre-wrap">{contactAddress}</span>
                  </p>
                )}
                {contactPhone && (
                  <p className="flex items-center gap-1.5 text-[13px] text-primary-foreground/60">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <a href={`tel:${contactPhone.replace(/[^+\d]/g, "")}`} className="hover:text-primary-foreground transition-colors">
                      {contactPhone}
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/80 mb-3 font-sans">
              {sectionsTitle}
            </h4>
            <ul className="space-y-1.5">
              {links.map(cat => (
                <li key={cat.href}>
                  <Link
                    href={cat.href}
                    className="text-[13px] text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {t(cat.labelKey, cat.defaultLabel)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/80 mb-3 font-sans flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {newsletterTitle}
            </h4>
            <p className="text-[13px] text-primary-foreground/90 mb-3 leading-relaxed">
              {newsletterDesc}
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
                placeholder={emailPlaceholder}
                className="bg-primary-foreground/10 border-none text-primary-foreground placeholder:text-primary-foreground/70 w-full h-10 text-sm"
                required
              />
              <Button
                type="submit"
                variant="default"
                size="sm"
                className="w-full sm:w-auto h-10 px-3.5 bg-primary text-white hover:bg-primary/90 shadow-md transition-all active:scale-95"
                disabled={subscribeMutation.isPending}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>

        {/* Barre inférieure fine */}
        <div className="border-t border-primary-foreground/10 mt-8 pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-primary-foreground/45">
              {copyright}
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-primary-foreground/50 hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
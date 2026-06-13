import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import { Menu, X, User, LogOut, Shield, Newspaper, Facebook, Instagram, Youtube, Sun, Moon, FlaskConical } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import NotificationBell from "./NotificationBell";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV_LINKS: { href: string; labelKey: string; defaultLabel: string; icon?: boolean }[] = [
  { href: "/", labelKey: "nav.home", defaultLabel: "Accueil" },
  { href: "/publication-du-jour", labelKey: "nav.dailyPost", defaultLabel: "Publication du jour" },
  { href: "/galeries", labelKey: "nav.galleries", defaultLabel: "Galeries" },
  { href: "/culte-en-ligne", labelKey: "nav.onlineService", defaultLabel: "Culte en ligne" },
  { href: "/bibliotheque", labelKey: "nav.library", defaultLabel: "Bibliothèque" },
];

const SOCIAL_LINKS = [
  { 
    href: "https://www.facebook.com/G12France/", 
    icon: <Facebook className="w-5 h-5" />, 
    label: "Facebook",
    hoverColor: "hover:text-[#1877F2]"
  },
  { 
    href: "https://www.instagram.com/cci.paris/", 
    icon: <Instagram className="w-5 h-5" />, 
    label: "Instagram",
    hoverColor: "hover:text-[#E4405F]"
  },
  { 
    href: "https://www.youtube.com/@media.mpecciparis", 
    icon: <Youtube className="w-5 h-5" />, 
    label: "YouTube",
    hoverColor: "hover:text-[#FF0000]"
  },
];

export default function SiteHeader() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  const isAdmin = user?.role === "admin";
  const isEditeur = user?.role === "editeur";
  const isBibliotheque = user?.role === "bibliotheque";
  const hasAdminAccess = isAdmin || isEditeur || isBibliotheque;

  const { theme, toggleTheme, switchable } = useTheme();
  const { data: settings } = trpc.siteSettings.getAll.useQuery();
  const enableThemeToggle = switchable || settings?.["design.enableThemeToggle"] === "true";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/60">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-primary via-ring to-primary" />

      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="g12-logo">
              <img
                src="/logo.webp"
                alt="G12 Paris Médias"
                className="h-10 w-10 rounded-full object-cover shadow-sm group-hover:shadow-md transition-shadow"
              />
            </span>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground font-serif">
                G12 Paris
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-sans font-medium -mt-0.5">
                infos médias
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(link => {
              const isActive =
                location === link.href ||
                (link.href !== "/" && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {link.icon && <FlaskConical className="w-3.5 h-3.5" />}
                  {t(link.labelKey, link.defaultLabel)}
                </Link>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Social Icons Desktop */}
            <div className="hidden lg:flex items-center gap-3 ml-2 border-l border-border/60 pl-5">
              {SOCIAL_LINKS.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-muted-foreground transition-all duration-300 hover:scale-110 ${social.hoverColor}`}
                  title={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* Theme toggle */}
            {enableThemeToggle && toggleTheme && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-300 hover:scale-110"
                title={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}
                aria-label="Basculer le thème"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-400" />
                )}
              </button>
            )}

            <LanguageSwitcher />

            <div className="flex items-center gap-2">
              {isAuthenticated && <NotificationBell />}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 px-2 sm:px-3">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <span className="hidden sm:inline text-sm font-medium">
                        {user?.name || "Utilisateur"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {hasAdminAccess && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/admin"
                            className="flex items-center gap-2 w-full"
                          >
                            <Shield className="w-4 h-4" />
                            Administration
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  size="sm"
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="font-medium px-3 sm:px-4 ml-1 sm:ml-0"
                >
                  {t('nav.login', 'Connexion')}
                </Button>
              )}

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden ml-1 sm:ml-2 touch-manipulation"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="lg:hidden w-full pb-6 border-t border-border/40 pt-3 flex flex-col animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1 mb-6">
              {NAV_LINKS.map(link => {
                const isActive =
                  location === link.href ||
                  (link.href !== "/" && location.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-3 text-base font-medium rounded-md transition-colors touch-manipulation flex items-center gap-2 ${
                      isActive
                        ? "text-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent active:bg-accent/80"
                    }`}
                  >
                    {link.icon && <FlaskConical className="w-4 h-4" />}
                    {t(link.labelKey, link.defaultLabel)}
                  </Link>
                );
              })}
              {hasAdminAccess && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-base font-medium rounded-md text-primary hover:bg-primary/5 touch-manipulation"
                >
                  <Shield className="w-4 h-4 inline mr-2" />
                  Administration
                </Link>
              )}
            </div>

            {/* Social Icons Mobile */}
            <div className="px-4 pt-6 border-t border-border/40">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-4">Suivez-nous</p>
              <div className="flex items-center gap-6">
                {SOCIAL_LINKS.map(social => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-muted-foreground transition-all duration-300 touch-manipulation p-2 rounded-lg hover:bg-accent ${social.hoverColor}`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Theme toggle mobile */}
            {enableThemeToggle && toggleTheme && (
              <div className="px-4 pt-4 border-t border-border/40">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 w-full px-4 py-3 text-base font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors touch-manipulation"
                >
                  {theme === 'light' ? (
                    <><Moon className="w-5 h-5" /> Mode Sombre</>
                  ) : (
                    <><Sun className="w-5 h-5 text-amber-400" /> Mode Clair</>
                  )}
                </button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

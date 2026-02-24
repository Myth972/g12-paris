/**
 * Admin Navigation Breadcrumb Component
 * Shows current location and allows quick navigation
 */

import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  active?: boolean;
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function AdminBreadcrumb({ items, className }: AdminBreadcrumbProps) {
  return (
    <nav
      className={cn(
        "flex items-center gap-1 text-sm px-4 py-3 bg-muted rounded-lg mb-6",
        className
      )}
      aria-label="Breadcrumb"
    >
      {/* Home link */}
      <Link href="/admin">
        <a className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <Home className="w-4 h-4" />
          <span>Admin</span>
        </a>
      </Link>

      {/* Breadcrumb items */}
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          {item.href && !item.active ? (
            <Link href={item.href}>
              <a className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </a>
            </Link>
          ) : (
            <span
              className={cn(
                "flex items-center gap-1",
                item.active ? "text-foreground font-semibold" : "text-muted-foreground"
              )}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

/**
 * Admin Navigation Links Component
 * Shows available sections with icons and descriptions
 */

interface NavLink {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive";
  };
}

interface AdminNavLinksProps {
  activeSection: string;
  links: NavLink[];
  onSelect: (id: string) => void;
}

export function AdminNavLinks({ activeSection, links, onSelect }: AdminNavLinksProps) {
  return (
    <div className="grid gap-3 mb-8">
      {links.map((link) => (
        <button
          key={link.id}
          onClick={() => onSelect(link.id)}
          className={cn(
            "flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left",
            activeSection === link.id
              ? "border-primary bg-primary/5"
              : "border-muted hover:border-primary/50 hover:bg-muted"
          )}
        >
          <div className="flex-shrink-0 text-2xl">{link.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{link.label}</h3>
              {link.badge && (
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded font-medium",
                    link.badge.variant === "destructive"
                      ? "bg-destructive/10 text-destructive"
                      : link.badge.variant === "secondary"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {link.badge.text}
                </span>
              )}
            </div>
            {link.description && (
              <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

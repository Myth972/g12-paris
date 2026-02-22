import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Settings, Pencil } from "lucide-react";
import { Link } from "wouter";

interface AdminQuickEditProps {
    tab: "articles" | "gallery" | "publications" | "pages" | "notifications";
    label?: string;
    className?: string;
}

/**
 * Reusable component that displays an "Edit" button only for administrators.
 * Useful for providing direct access to the admin dashboard from public pages.
 */
export default function AdminQuickEdit({ tab, label = "Modifier cette page", className = "" }: AdminQuickEditProps) {
    const { user } = useAuth();

    if (user?.role !== "admin") {
        return null;
    }

    return (
        <div className={`flex justify-end p-4 bg-muted/30 border-b border-border ${className}`}>
            <div className="container flex justify-end">
                <Button size="sm" variant="outline" className="gap-2 shadow-sm bg-background" asChild>
                    <Link href={`/admin?tab=${tab}`}>
                        <Settings className="w-4 h-4 text-primary" />
                        <span className="font-medium text-xs uppercase tracking-wider">{label}</span>
                    </Link>
                </Button>
            </div>
        </div>
    );
}

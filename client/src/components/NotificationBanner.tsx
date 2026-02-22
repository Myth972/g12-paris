import { trpc } from "@/lib/trpc";
import { X, AlertCircle, AlertTriangle, Info, Sparkles, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

const TYPE_CONFIG = {
    info: { icon: Info, color: "bg-blue-600", label: "Info" },
    alerte: { icon: AlertTriangle, color: "bg-amber-500", label: "Alerte" },
    "nouveauté": { icon: Sparkles, color: "bg-emerald-600", label: "Nouveauté" },
    important: { icon: AlertCircle, color: "bg-red-600", label: "Important" },
};

export default function NotificationBanner() {
    const { isAuthenticated } = useAuth();
    const [dismissedId, setDismissedId] = useState<number | null>(null);
    const [, setLocation] = useLocation();

    // We fetch public notifications (those from myNotifications if authenticated, 
    // or we might need a public endpoint for non-auth users if they should see it too)
    // For now, let's use myNotifications if authenticated, otherwise hide.
    // Actually, the user wants "Global Notification Mode", so we'll use list but filter for important.

    // NOTE: adminProcedure restricts some endpoints. Let's see if we can use public ones.
    // notifications.myNotifications is protectedProcedure.

    const { data } = trpc.notifications.myNotifications.useQuery(
        { limit: 1 },
        {
            enabled: isAuthenticated,
            staleTime: 300000, // 5 min
        }
    );

    const latestNotif = data?.items?.[0];

    useEffect(() => {
        const saved = localStorage.getItem("dismissed_notification_id");
        if (saved) setDismissedId(parseInt(saved));
    }, []);

    const handleDismiss = () => {
        if (latestNotif) {
            localStorage.setItem("dismissed_notification_id", latestNotif.id.toString());
            setDismissedId(latestNotif.id);
        }
    };

    if (!isAuthenticated || !latestNotif || latestNotif.isRead || latestNotif.id === dismissedId) {
        return null;
    }

    // Only show Important or Alert in the banner
    if (latestNotif.type !== "important" && latestNotif.type !== "alerte") {
        return null;
    }

    const config = TYPE_CONFIG[latestNotif.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info;
    const Icon = config.icon;

    return (
        <div className={`${config.color} text-white py-2 px-4 shadow-md relative z-[100] animate-in fade-in slide-in-from-top duration-500`}>
            <div className="container mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex w-8 h-8 rounded-full bg-white/20 items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                            <span className="font-bold underline mr-2">{latestNotif.title} :</span>
                            {latestNotif.message}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    {latestNotif.linkUrl && (
                        <button
                            onClick={() => {
                                if (latestNotif.linkUrl?.startsWith("/")) {
                                    setLocation(latestNotif.linkUrl);
                                } else if (latestNotif.linkUrl) {
                                    window.open(latestNotif.linkUrl, "_blank");
                                }
                            }}
                            className="text-xs flex items-center gap-1.5 hover:bg-white/10 px-2 py-1 rounded transition-colors"
                        >
                            Voir plus <ExternalLink className="w-3 h-3" />
                        </button>
                    )}
                    <button
                        onClick={handleDismiss}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Fermer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

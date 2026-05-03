import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  Sparkles,
  AlertCircle,
  ExternalLink,
  History,
  Calendar,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_CONFIG = {
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-50",
    label: "Info",
  },
  alerte: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-50",
    label: "Alerte",
  },
  nouveauté: {
    icon: Sparkles,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    label: "Nouveauté",
  },
  important: {
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Important",
  },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;

  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function getDayLabel(date: Date): string {
  const now = new Date();
  const d = new Date(date);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (itemDate.getTime() === today.getTime()) return "Aujourd'hui";
  if (itemDate.getTime() === yesterday.getTime()) return "Hier";

  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data } = trpc.notifications.myNotifications.useQuery(
    { limit: 20 },
    { refetchInterval: 30000 } // Poll every 30s
  );

  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.myNotifications.invalidate();
    },
  });

  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.myNotifications.invalidate();
    },
  });

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, any[]> = {};
    items.forEach((notif: any) => {
      const label = getDayLabel(notif.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(notif);
    });
    return groups;
  }, [items]);

  const handleNotificationClick = (notif: (typeof items)[0]) => {
    if (!notif.isRead) {
      markAsRead.mutate({ notificationId: notif.id });
    }
    if (notif.linkUrl) {
      setOpen(false);
      if (notif.linkUrl.startsWith("/")) {
        setLocation(notif.linkUrl);
      } else {
        window.open(notif.linkUrl, "_blank");
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 hover:bg-accent/80 transition-colors"
        >
          <AnimatePresence mode="wait">
            {unreadCount > 0 ? (
              <motion.div
                key="ring"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <BellRing className="w-[18px] h-[18px] text-primary" />
              </motion.div>
            ) : (
              <motion.div
                key="bell"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <Bell className="w-[18px] h-[18px] text-muted-foreground" />
              </motion.div>
            )}
          </AnimatePresence>

          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm border border-white"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[380px] p-0 shadow-xl border-border/40 overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-border/60">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-none"
              >
                {unreadCount} nouvelles
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <div className="max-h-[60vh] md:max-h-[450px] overflow-y-auto overscroll-contain">
          {items.length === 0 ? (
            <div className="py-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium text-foreground/60">
                Vous êtes à jour !
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Aucune nouvelle notification pour le moment.
              </p>
            </div>
          ) : (
            <div className="pb-2">
              {Object.entries(groupedNotifications).map(
                ([label, groupItems], groupIdx) => (
                  <div key={label} className="mt-2">
                    <div className="px-4 py-2 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {label}
                      </span>
                    </div>
                    <div className="divide-y divide-border/40">
                      {groupItems.map((notif: any) => {
                        const config =
                          TYPE_CONFIG[notif.type as keyof typeof TYPE_CONFIG] ??
                          TYPE_CONFIG.info;
                        const Icon = config.icon;

                        return (
                          <motion.div
                            key={notif.id}
                            layout
                            className={`flex gap-3 px-4 py-4 transition-all cursor-pointer relative ${
                              !notif.isRead
                                ? "bg-primary/[0.02]"
                                : "hover:bg-accent/40"
                            }`}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            {/* Unread indicator pulse */}
                            {!notif.isRead && (
                              <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                            )}

                            {/* Type icon */}
                            <div
                              className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center mt-0.5 shadow-sm border border-white/50`}
                            >
                              <Icon className={`w-5 h-5 ${config.color}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={`text-sm leading-tight mb-1 ${!notif.isRead ? "font-bold text-foreground" : "text-foreground/90"}`}
                                >
                                  {notif.title}
                                </p>
                                {!notif.isRead && (
                                  <motion.span
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{
                                      repeat: Infinity,
                                      duration: 2,
                                    }}
                                    className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1 shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                                  />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground/90 leading-relaxed mb-2">
                                {notif.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-medium text-muted-foreground/60 flex items-center gap-1">
                                  <History className="w-3 h-3" />
                                  {formatTimeAgo(notif.createdAt)}
                                </span>
                                {notif.linkUrl && (
                                  <div className="p-1 rounded-md bg-accent/50">
                                    <ExternalLink className="w-3 h-3 text-primary" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="px-4 py-2 border-t border-border/40 bg-muted/20">
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-semibold">
              Fin des notifications
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

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
  "nouveauté": {
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
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
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

  const handleNotificationClick = (notif: (typeof items)[0]) => {
    if (!notif.isRead) {
      markAsRead.mutate({ notificationId: notif.id });
    }
    if (notif.linkUrl) {
      setOpen(false);
      // If it's an internal link, use router
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
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          {unreadCount > 0 ? (
            <BellRing className="w-[18px] h-[18px] text-foreground" />
          ) : (
            <Bell className="w-[18px] h-[18px] text-muted-foreground" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-primary hover:text-primary"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <ScrollArea className="max-h-[400px]">
          {items.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {items.map((notif) => {
                const config = TYPE_CONFIG[notif.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info;
                const Icon = config.icon;

                return (
                  <div
                    key={notif.id}
                    className={`flex gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-accent/50 ${
                      !notif.isRead ? "bg-primary/[0.03]" : ""
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    {/* Type icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center mt-0.5`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${!notif.isRead ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground/70">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                        {notif.linkUrl && (
                          <ExternalLink className="w-3 h-3 text-muted-foreground/50" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

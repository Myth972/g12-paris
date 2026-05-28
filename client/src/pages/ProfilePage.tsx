import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Lock, History, ArrowLeft, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" });
  const { t } = useTranslation();
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notificationsQuery = trpc.notifications.myNotifications.useQuery();
  const updatePasswordMutation = trpc.users.updatePassword.useMutation({
    onSuccess: () => {
      setPasswordMessage({ type: "success", text: t('admin.profile.toastPasswordSuccess') });
      setPasswordData({ current: "", new: "", confirm: "" });
      setTimeout(() => setPasswordMessage(null), 3000);
    },
    onError: (err) => {
      setPasswordMessage({ type: "error", text: err.message });
    },
  });

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <p>Veuillez vous connecter pour accéder à cette page.</p>
      </div>
    );
  }

  const handlePasswordChange = () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      setPasswordMessage({ type: "error", text: t('admin.profile.toastFillAll') });
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setPasswordMessage({ type: "error", text: t('admin.profile.toastPasswordMismatch') });
      return;
    }
    if (passwordData.new.length < 4) {
      setPasswordMessage({ type: "error", text: t('admin.profile.toastPasswordLength') });
      return;
    }
    updatePasswordMutation.mutate({
      userId: user.id,
      currentPassword: passwordData.current,
      newPassword: passwordData.new,
    });
  };

  const roleLabels: Record<string, string> = {
    admin: t('admin.roles.admin'),
    editeur: t('admin.roles.editeur'),
    bibliotheque: t('admin.roles.bibliotheque'),
    user: t('admin.roles.user'),
  };

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800 border-red-200",
    editeur: "bg-blue-100 text-blue-800 border-blue-200",
    bibliotheque: "bg-green-100 text-green-800 border-green-200",
    user: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <div className="min-h-screen bg-secondary/30 py-8 px-4">
      <div className="container max-w-3xl">
        <Button variant="ghost" onClick={() => setLocation("/admin")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('admin.profile.backToDashboard')}
        </Button>

        <h1 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
          <User className="w-6 h-6" />
          {t('admin.profile.title')}
        </h1>

        <div className="space-y-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {t('admin.profile.accountInfo')}
              </CardTitle>
              <CardDescription>
                {t('admin.profile.accountInfoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">{t('admin.profile.name')}</span>
                <span className="font-medium">{user.name || t('admin.profile.nameNotSet')}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">{t('admin.profile.email')}</span>
                <span className="font-medium">{user.email || t('admin.profile.emailNotSet')}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">{t('admin.profile.role')}</span>
                <Badge className={roleColors[user.role] || roleColors.user}>
                  {roleLabels[user.role] || "Utilisateur"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-muted-foreground">{t('admin.profile.lastLogin')}</span>
                <span className="font-medium text-sm">
                  {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString("fr-FR") : t('admin.profile.never')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {t('admin.profile.changePassword')}
              </CardTitle>
              <CardDescription>
                {t('admin.profile.changePasswordDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">{t('admin.profile.currentPassword')}</Label>
                <Input
                  id="current"
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new">{t('admin.profile.newPassword')}</Label>
                  <Input
                    id="new"
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">{t('admin.profile.confirmPassword')}</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              {passwordMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  passwordMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}>
                  {passwordMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : null}
                  {passwordMessage.text}
                </div>
              )}
              <Button
                onClick={handlePasswordChange}
                disabled={updatePasswordMutation.isPending}
                className="w-full sm:w-auto"
              >
                {updatePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('admin.profile.saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('admin.profile.save')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Activity History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                {t('admin.profile.notifHistory')}
              </CardTitle>
              <CardDescription>
                {t('admin.profile.notifHistoryDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notificationsQuery.isLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Chargement...
                </div>
              ) : notificationsQuery.data?.items?.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {t('admin.profile.noNotifications')}
                </div>
              ) : (
                <div className="space-y-3">
                  {notificationsQuery.data?.items?.slice(0, 5).map((notif: any) => (
                    <div
                      key={notif.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        notif.isRead ? "bg-muted/30" : "bg-primary/5"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`font-medium truncate ${!notif.isRead ? "" : "text-muted-foreground"}`}>
                          {notif.title}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{notif.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-4 shrink-0">
                        {new Date(notif.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
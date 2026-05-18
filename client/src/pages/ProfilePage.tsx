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

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notificationsQuery = trpc.notifications.myNotifications.useQuery();
  const updatePasswordMutation = trpc.users.updatePassword.useMutation({
    onSuccess: () => {
      setPasswordMessage({ type: "success", text: "Mot de passe modifié avec succès !" });
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
      setPasswordMessage({ type: "error", text: "Veuillez remplir tous les champs" });
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setPasswordMessage({ type: "error", text: "Les mots de passe ne correspondent pas" });
      return;
    }
    if (passwordData.new.length < 4) {
      setPasswordMessage({ type: "error", text: "Le mot de passe doit contenir au moins 4 caractères" });
      return;
    }
    updatePasswordMutation.mutate({
      userId: user.id,
      currentPassword: passwordData.current,
      newPassword: passwordData.new,
    });
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrateur",
    editeur: "Éditeur",
    bibliotheque: "Bibliothèque",
    user: "Utilisateur",
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
          Retour au dashboard
        </Button>

        <h1 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
          <User className="w-6 h-6" />
          Mon Profil
        </h1>

        <div className="space-y-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Informations du compte
              </CardTitle>
              <CardDescription>
                Vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">Nom</span>
                <span className="font-medium">{user.name || "Non défini"}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{user.email || "Non défini"}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">Rôle</span>
                <Badge className={roleColors[user.role] || roleColors.user}>
                  {roleLabels[user.role] || "Utilisateur"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-muted-foreground">Dernière connexion</span>
                <span className="font-medium text-sm">
                  {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString("fr-FR") : "Jamais"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Changer le mot de passe
              </CardTitle>
              <CardDescription>
                Laissez vide si vous ne voulez pas changer de mot de passe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Mot de passe actuel</Label>
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
                  <Label htmlFor="new">Nouveau mot de passe</Label>
                  <Input
                    id="new"
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmer</Label>
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
                    Modification...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
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
                Historique des notifications
              </CardTitle>
              <CardDescription>
                Vos récentes notifications reçues
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
                  Aucune notification pour le moment
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
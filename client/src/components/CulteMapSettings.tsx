import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Save, Loader2, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function CulteMapSettings() {
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const utils = trpc.useUtils();
  const setSetting = trpc.siteSettings.set.useMutation({
    onSuccess: () => {
      utils.siteSettings.getAll.invalidate();
      toast.success("Lieu & carte enregistrés");
    },
    onError: err => toast.error("Erreur: " + err.message),
  });

  const [enabled, setEnabled] = useState(false);
  const [venueName, setVenueName] = useState("");
  const [venueQuery, setVenueQuery] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueSchedule, setVenueSchedule] = useState("");

  useEffect(() => {
    if (settingsQuery.data) {
      setEnabled(settingsQuery.data["culte.mapEnabled"] === "true");
      setVenueName((settingsQuery.data["culte.venueName"] as string) || "");
      setVenueQuery((settingsQuery.data["culte.venueQuery"] as string) || "");
      setVenueAddress((settingsQuery.data["culte.venueAddress"] as string) || "");
      setVenueSchedule((settingsQuery.data["culte.venueSchedule"] as string) || "");
    }
  }, [settingsQuery.data]);

  const handleSave = () => {
    setSetting.mutate({ key: "culte.mapEnabled", value: String(enabled) });
    setSetting.mutate({ key: "culte.venueName", value: venueName });
    setSetting.mutate({ key: "culte.venueQuery", value: venueQuery });
    setSetting.mutate({ key: "culte.venueAddress", value: venueAddress });
    setSetting.mutate({ key: "culte.venueSchedule", value: venueSchedule });
  };

  const previewQuery = venueQuery || "Paris, France";
  const previewEnabled = enabled || false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Lieu & Carte du Culte
        </CardTitle>
        <CardDescription>
          Affichez une carte Google Maps pour indiquer où se déroule le culte chaque dimanche
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="mapEnabled"
            checked={enabled}
            onChange={e => setEnabled(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="mapEnabled" className="cursor-pointer">
            Afficher la carte Google Maps sur la page Culte en ligne
          </Label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="venueName">Nom du lieu</Label>
            <Input
              id="venueName"
              placeholder="ex: Centre de l'Église G12 Paris"
              value={venueName}
              onChange={e => setVenueName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venueSchedule">Horaire du culte (optionnel)</Label>
            <Input
              id="venueSchedule"
              placeholder="ex: Chaque dimanche à 10h00"
              value={venueSchedule}
              onChange={e => setVenueSchedule(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="venueQuery">Adresse / Recherche Google Maps</Label>
            <Input
              id="venueQuery"
              placeholder="ex: 10 rue de la Paix, 75002 Paris"
              value={venueQuery}
              onChange={e => setVenueQuery(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Adresse utilisée pour centrer la carte.
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="venueAddress">Adresse affichée (optionnel)</Label>
            <Input
              id="venueAddress"
              placeholder="ex: 10 rue de la Paix, 75002 Paris"
              value={venueAddress}
              onChange={e => setVenueAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={setSetting.isPending}
            className="h-10"
          >
            {setSetting.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>

        {previewEnabled && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Eye className="w-4 h-4" /> Aperçu de la carte
            </div>
            <div className="relative rounded-lg overflow-hidden border aspect-video min-h-[200px]">
              <iframe
                title="Aperçu carte Google Maps"
                src={`https://www.google.com/maps?q=${encodeURIComponent(previewQuery)}&output=embed`}
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(previewQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              Ouvrir dans Google Maps
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
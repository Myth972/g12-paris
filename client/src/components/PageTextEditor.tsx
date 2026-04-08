import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";

type PageTextEditorProps = {
  pageKey: string;
  textKey: string;
  defaultText: string;
  className?: string;
};

export default function PageTextEditor({
  pageKey,
  textKey,
  defaultText,
  className,
}: PageTextEditorProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const setSetting = trpc.siteSettings.set.useMutation({
    onError: error => toast.error("Erreur: " + error.message),
  });

  const key = useMemo(
    () => `pageText.${pageKey}.${textKey}`,
    [pageKey, textKey]
  );

  const text = (settingsQuery.data?.[key] as string | undefined) ?? defaultText;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  useEffect(() => {
    if (!editing) setDraft(text);
  }, [editing, text]);

  const handleSave = async () => {
    try {
      await setSetting.mutateAsync({ key, value: draft });
      toast.success("Texte mis à jour");
      setEditing(false);
    } catch {
      // handled by onError
    }
  };

  return (
    <div className="relative">
      {isAdmin && !editing && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 -top-1 h-7 px-2 text-[10px]"
          onClick={() => setEditing(true)}
        >
          <Pencil className="w-3 h-3 mr-1" />
          Modifier
        </Button>
      )}
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={3}
            className="text-sm"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={setSetting.isPending}
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              Enregistrer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(false)}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <p className={className}>{text}</p>
      )}
    </div>
  );
}

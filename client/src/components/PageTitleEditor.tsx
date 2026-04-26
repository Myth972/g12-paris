import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";

type PageTitleEditorProps = {
  pageKey: string;
  defaultH1: string;
  defaultH2?: string;
  h1ClassName?: string;
  h2ClassName?: string;
  alignClassName?: string;
};

function renderWithLineBreaks(text: string) {
  const lines = text.split("\n");
  return lines.map((line, idx) => (
    <span key={`${line}-${idx}`}>
      {line}
      {idx < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

export default function PageTitleEditor({
  pageKey,
  defaultH1,
  defaultH2 = "",
  h1ClassName,
  h2ClassName,
  alignClassName,
}: PageTitleEditorProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const setSetting = trpc.siteSettings.set.useMutation({
    onError: error => toast.error("Erreur: " + error.message),
  });

  const keys = useMemo(
    () => ({
      h1: `pageTitle.${pageKey}.h1`,
      h2: `pageTitle.${pageKey}.h2`,
    }),
    [pageKey]
  );

  const h1 = (settingsQuery.data?.[keys.h1] as string | undefined) ?? defaultH1;
  const h2 = (settingsQuery.data?.[keys.h2] as string | undefined) ?? defaultH2;

  const [editing, setEditing] = useState(false);
  const [draftH1, setDraftH1] = useState(h1);
  const [draftH2, setDraftH2] = useState(h2);

  useEffect(() => {
    if (!editing) {
      setDraftH1(h1);
      setDraftH2(h2);
    }
  }, [editing, h1, h2]);

  const handleSave = async () => {
    try {
      await Promise.all([
        setSetting.mutateAsync({ key: keys.h1, value: draftH1 }),
        setSetting.mutateAsync({ key: keys.h2, value: draftH2 }),
      ]);
      toast.success("Titres mis à jour");
      setEditing(false);
    } catch {
      // handled by mutation onError
    }
  };

  return (
    <div className={`relative ${alignClassName ?? ""}`}>
      {isAdmin && !editing && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute -right-4 -top-8 z-20 h-8 px-3 text-xs shadow-md bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={() => setEditing(true)}
        >
          <Pencil className="w-3 h-3 mr-1" />
          Modifier
        </Button>
      )}

      {editing ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Titre H1
            </label>
            <Textarea
              value={draftH1}
              onChange={e => setDraftH1(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Sous-titre H2
            </label>
            <Input
              value={draftH2}
              onChange={e => setDraftH2(e.target.value)}
              className="text-sm"
              placeholder="Optionnel"
            />
          </div>
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
        <div>
          <h1 className={h1ClassName}>{renderWithLineBreaks(h1)}</h1>
          {h2?.trim() ? (
            <h2 className={h2ClassName}>{renderWithLineBreaks(h2)}</h2>
          ) : null}
        </div>
      )}
    </div>
  );
}

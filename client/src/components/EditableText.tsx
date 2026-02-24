import React, { useState } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Edit2, Check, X } from 'lucide-react';
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EditableTextProps {
  /** Le texte à afficher */
  value: string | null | undefined;
  
  /** Identifiant unique de la page */
  pageId: string;
  
  /** Nom du champ pour sauvegarde */
  fieldName: string;
  
  /** Classe CSS pour le mode lecture */
  className?: string;
  
  /** Classe CSS pour l'input */
  inputClassName?: string;
  
  /** Type d'élément (p, h1, h2, etc.) */
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
  
  /** Nombre de lignes (textarea si > 1) */
  rows?: number;
  
  /** Placeholder si vide */
  placeholder?: string;
  
  /** Afficher le bouton éditer */
  showEditButton?: boolean;
  
  /** Callback après sauvegarde */
  onSave?: (newValue: string) => void;
}

/**
 * Composant EditableText - Permet édition en place du texte
 * Admin-only avec sauvegarde en BDD
 * 
 * Usage:
 * <EditableText
 *   value={title}
 *   pageId="culte-en-ligne"
 *   fieldName="heroTitle"
 *   as="h1"
 * />
 */
export function EditableText({
  value,
  pageId,
  fieldName,
  className = "",
  inputClassName = "",
  as = 'p',
  rows = 1,
  placeholder = "Cliquez pour éditer",
  showEditButton = true,
  onSave
}: EditableTextProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);

  // Mutation pour sauvegarder en BDD
  const saveMutation = trpc.pages.updateContent.useMutation();

  const isAdmin = user?.role === 'admin';
  const displayValue = value || placeholder;

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await saveMutation.mutateAsync({
        pageId,
        fieldName,
        content: editValue,
      });

      toast.success("Texte mis à jour!");
      setIsEditing(false);
      onSave?.(editValue);
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
      console.error(error);
      setEditValue(value || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  // Mode lecture (admin peut cliquer)
  if (!isEditing && isAdmin) {
    return (
      <div className="group relative inline-block">
        {renderElement(as, displayValue, className)}
        <button
          onClick={() => setIsEditing(true)}
          className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
          title="Cliquez pour éditer"
        >
          <Edit2 className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  // Mode lecture (non-admin)
  if (!isEditing) {
    return renderElement(as, displayValue, className);
  }

  // Mode édition
  return (
    <div className="flex gap-2 items-start">
      {rows > 1 ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          rows={rows}
          className={`flex-1 p-2 border border-input rounded-md resize-none ${inputClassName}`}
          disabled={isSaving}
          autoFocus
        />
      ) : (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className={`flex-1 p-2 border border-input rounded-md ${inputClassName}`}
          disabled={isSaving}
          autoFocus
        />
      )}
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="default"
          onClick={handleSave}
          disabled={isSaving}
          className="gap-1"
        >
          <Check className="w-4 h-4" />
          {isSaving ? "..." : "OK"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
          className="gap-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Rendu du texte en fonction du type d'élément
 */
function renderElement(
  as: string,
  content: string,
  className: string
): React.ReactNode {
  const props = {
    className,
    children: content,
  };

  switch (as) {
    case 'h1':
      return <h1 {...props} />;
    case 'h2':
      return <h2 {...props} />;
    case 'h3':
      return <h3 {...props} />;
    case 'h4':
      return <h4 {...props} />;
    case 'h5':
      return <h5 {...props} />;
    case 'h6':
      return <h6 {...props} />;
    case 'div':
      return <div {...props} />;
    case 'p':
    default:
      return <p {...props} />;
  }
}

/**
 * Composant wrapper pour sections complètes
 * Utile pour éditer des descriptions multi-lignes
 */
export function EditableSection({
  title,
  content,
  pageId,
  fieldName,
  className = "",
}: {
  title: string;
  content: string | null | undefined;
  pageId: string;
  fieldName: string;
  className?: string;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <EditableText
        value={content}
        pageId={pageId}
        fieldName={fieldName}
        as="div"
        rows={4}
        placeholder={`Cliquez pour éditer ${title.toLowerCase()}`}
      />
      {isAdmin && (
        <p className="text-xs text-muted-foreground mt-2">
          💡 Double-cliquez ou cliquez l'icône pour éditer (Admin)
        </p>
      )}
    </div>
  );
}

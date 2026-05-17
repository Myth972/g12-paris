import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Highlighter,
  Palette,
  Undo2,
  Redo2,
  Quote,
  Minus,
  Type,
  ChevronDown,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

const COLORS = [
  { label: "Noir", value: "#000000" },
  { label: "Blanc", value: "#ffffff" },
  { label: "Gris", value: "#6b7280" },
  { label: "Rouge", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Jaune", value: "#ca8a04" },
  { label: "Vert", value: "#16a34a" },
  { label: "Bleu", value: "#2563eb" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Violet", value: "#9333ea" },
  { label: "Rose", value: "#db2777" },
  { label: "Marron", value: "#92400e" },
];

const HIGHLIGHT_COLORS = [
  { label: "Jaune", value: "#fef08a" },
  { label: "Vert", value: "#bbf7d0" },
  { label: "Bleu", value: "#bfdbfe" },
  { label: "Rose", value: "#fce7f3" },
  { label: "Orange", value: "#fed7aa" },
  { label: "Violet", value: "#e9d5ff" },
];

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  isActive?: boolean;
  title?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`p-1.5 sm:p-1.5 rounded text-sm transition-colors inline-flex items-center justify-center touch-manipulation ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Rédigez votre contenu ici...",
  minHeight = "300px",
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false);
  const [headingOpen, setHeadingOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // use custom heading
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline cursor-pointer",
          },
        },
        underline: {},
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({ multicolor: true }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none",
        style: `min-height: ${minHeight}; padding: 1rem;`,
      },
    },
  });

  // Sync if content changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();
    setLinkUrl("");
  }, [editor, linkUrl]);

  if (!editor) return null;

  const currentHeading = editor.isActive("heading", { level: 1 })
    ? "Titre 1"
    : editor.isActive("heading", { level: 2 })
      ? "Titre 2"
      : editor.isActive("heading", { level: 3 })
        ? "Titre 3"
        : "Paragraphe";

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 sm:p-2 border-b border-border/60 bg-muted/30 overflow-x-auto no-scrollbar">
        {/* Heading selector */}
        <Popover open={headingOpen} onOpenChange={setHeadingOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded hover:bg-muted text-foreground border border-border/60 min-w-[70px] sm:min-w-[90px] touch-manipulation"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentHeading}</span>
              <ChevronDown className="w-3 h-3 ml-auto" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1 max-w-[calc(100vw-2rem)]" align="start">
            <button
              type="button"
              className="flex items-center gap-2 w-full px-2 py-2 sm:py-1.5 text-sm rounded hover:bg-muted touch-manipulation"
              onClick={() => {
                editor.chain().focus().setParagraph().run();
                setHeadingOpen(false);
              }}
            >
              <span className="text-sm">Aa</span> Paragraphe
            </button>
            <button
              type="button"
              className="flex items-center gap-2 w-full px-2 py-2 sm:py-1.5 rounded hover:bg-muted touch-manipulation"
              onClick={() => {
                editor.chain().focus().setHeading({ level: 1 }).run();
                setHeadingOpen(false);
              }}
            >
              <Heading1 className="w-4 h-4" />
              <span className="text-xl font-bold font-serif leading-none">
                Titre 1
              </span>
            </button>
            <button
              type="button"
              className="flex items-center gap-2 w-full px-2 py-2 sm:py-1.5 rounded hover:bg-muted touch-manipulation"
              onClick={() => {
                editor.chain().focus().setHeading({ level: 2 }).run();
                setHeadingOpen(false);
              }}
            >
              <Heading2 className="w-4 h-4" />
              <span className="text-lg font-bold font-serif leading-none">
                Titre 2
              </span>
            </button>
            <button
              type="button"
              className="flex items-center gap-2 w-full px-2 py-2 sm:py-1.5 rounded hover:bg-muted touch-manipulation"
              onClick={() => {
                editor.chain().focus().setHeading({ level: 3 }).run();
                setHeadingOpen(false);
              }}
            >
              <Heading3 className="w-4 h-4" />
              <span className="text-base font-semibold font-serif leading-none">
                Titre 3
              </span>
            </button>
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Gras (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italique (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Souligné (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Barré"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Text color */}
        <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              title="Couleur du texte"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <div className="relative">
                <Palette className="w-4 h-4" />
                <div
                  className="absolute -bottom-0.5 left-0 right-0 h-1 rounded-sm"
                  style={{
                    backgroundColor:
                      (editor.getAttributes("textStyle").color as string) ||
                      "#000",
                  }}
                />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-2" align="start">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Couleur du texte
            </p>
            <div className="grid grid-cols-6 gap-1.5 mb-2">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.value }}
                  onClick={() => {
                    editor.chain().focus().setColor(c.value).run();
                    setColorPickerOpen(false);
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setColorPickerOpen(false);
              }}
            >
              Réinitialiser la couleur
            </button>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Popover
          open={highlightPickerOpen}
          onOpenChange={setHighlightPickerOpen}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              title="Surligner"
              className={`p-1.5 rounded hover:bg-muted ${editor.isActive("highlight") ? "bg-yellow-200" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Highlighter className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-2" align="start">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Surlignage
            </p>
            <div className="grid grid-cols-6 gap-1.5 mb-2">
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.value }}
                  onClick={() => {
                    editor
                      .chain()
                      .focus()
                      .setHighlight({ color: c.value })
                      .run();
                    setHighlightPickerOpen(false);
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                editor.chain().focus().unsetHighlight().run();
                setHighlightPickerOpen(false);
              }}
            >
              Supprimer
            </button>
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Aligner à gauche"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Centrer"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Aligner à droite"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
          title="Justifier"
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Liste à puces"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Liste numérotée"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Citation"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Ligne de séparation"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Link */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              title="Ajouter un lien"
              className={`p-1.5 rounded hover:bg-muted ${editor.isActive("link") ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <p className="text-xs font-medium mb-2">URL du lien</p>
            <div className="flex gap-2">
              <Input
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="h-8 text-xs"
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setLink();
                  }
                }}
              />
              <Button size="sm" onClick={setLink} className="h-8 px-3 text-xs">
                OK
              </Button>
            </div>
            {editor.isActive("link") && (
              <button
                type="button"
                className="text-xs text-destructive mt-1"
                onClick={() => editor.chain().focus().unsetLink().run()}
              >
                Supprimer le lien
              </button>
            )}
          </PopoverContent>
        </Popover>

        <div className="flex-1" />

        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Annuler (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Rétablir (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="[&_.ProseMirror]:min-h-[250px] [&_.ProseMirror]:p-4 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:font-serif [&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h1]:mt-4 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:font-serif [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:mt-3 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-primary/40 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-muted-foreground [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-6 [&_.ProseMirror_ul]:mb-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-6 [&_.ProseMirror_ol]:mb-3 [&_.ProseMirror_hr]:border-border [&_.ProseMirror_hr]:my-4 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/50 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror]:outline-none [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline"
      />

      {/* Character count (optional) */}
      <div className="px-4 py-1.5 border-t border-border/40 text-xs text-muted-foreground/60 text-right">
        {editor.storage.characterCount?.characters?.() ?? 0} caractères
      </div>
    </div>
  );
}

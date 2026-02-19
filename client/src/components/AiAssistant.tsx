import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Sparkles, Loader2, PenTool, Image as ImageIcon, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface AiAssistantProps {
    onApply: (text: string, type: "content" | "summary" | "title" | "image" | "correction") => void;
    currentContent?: string;
    currentTitle?: string;
}

export default function AiAssistant({ onApply, currentContent, currentTitle }: AiAssistantProps) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"summary" | "title" | "correction" | "content" | "image">("summary");
    const [prompt, setPrompt] = useState("");
    const [result, setResult] = useState("");
    const [generatedImage, setGeneratedImage] = useState<{ url: string; key: string } | null>(null);

    const generateText = trpc.ai.generateText.useMutation();
    const generateImage = trpc.ai.generateImage.useMutation();

    const isLoading = generateText.isPending || generateImage.isPending;

    const handleGenerate = async () => {
        setResult("");
        setGeneratedImage(null);

        try {
            if (mode === "image") {
                const res = await generateImage.mutateAsync({ prompt: prompt || currentTitle || "Image d'article" });
                if (res.url) {
                    setGeneratedImage(res as { url: string; key: string });
                    toast.success("Image générée !");
                }
            } else {
                const context = currentContent || currentTitle || "";
                const finalPrompt = prompt || (mode === "summary" ? "Génère un résumé pour cet article" : "Améliore ce texte");

                let apiType: "summary" | "title" | "correction" | "content" = "content";
                if (mode === "summary") apiType = "summary";
                if (mode === "title") apiType = "title";
                if (mode === "correction") apiType = "correction";

                const res = await generateText.mutateAsync({
                    type: apiType,
                    prompt: mode === "content" ? prompt : `${finalPrompt}\n\nContexte:\n${context}`,
                });

                setResult(res);
                toast.success("Texte généré !");
            }
        } catch (error) {
            toast.error("Erreur de génération");
            console.error(error);
        }
    };

    const handleApply = () => {
        if (mode === "image" && generatedImage) {
            onApply(generatedImage.url, "image");
            // We might need to pass the key as well in a real app, 
            // but for now we trust the url handling in parent
        } else if (result) {
            onApply(result, mode === "image" ? "image" : mode);
        }
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Assistant IA
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-indigo-700">
                        <Sparkles className="w-5 h-5" />
                        Assistant IA
                    </DialogTitle>
                    <DialogDescription>
                        Utilisez l'IA pour rédiger, corriger ou illustrer votre article.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Que voulez-vous faire ?</Label>
                        <Select value={mode} onValueChange={(v: any) => { setMode(v); setResult(""); setGeneratedImage(null); }}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="summary">Générer un résumé</SelectItem>
                                <SelectItem value="title">Suggérer des titres</SelectItem>
                                <SelectItem value="correction">Corriger / Améliorer le style</SelectItem>
                                <SelectItem value="content">Rédiger du contenu</SelectItem>
                                <SelectItem value="image">Générer une image</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Instructions (Prompt)</Label>
                        <Textarea
                            placeholder={mode === "image" ? "Décrivez l'image..." : "Donnez vos instructions..."}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground">
                            {mode === "summary" && "Laissez vide pour résumer le contenu actuel."}
                            {mode === "correction" && "Laissez vide pour corriger le contenu actuel."}
                        </p>
                    </div>

                    {(result || generatedImage) && (
                        <div className="bg-muted p-4 rounded-md mt-4 max-h-60 overflow-y-auto">
                            {mode === "image" && generatedImage ? (
                                <img src={generatedImage.url} alt="Generated" className="w-full h-auto rounded" />
                            ) : (
                                <p className="whitespace-pre-wrap text-sm">{result}</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
                    {!result && !generatedImage ? (
                        <Button onClick={handleGenerate} disabled={isLoading} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Générer
                        </Button>
                    ) : (
                        <Button onClick={handleApply} className="gap-2 bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4" />
                            Appliquer
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

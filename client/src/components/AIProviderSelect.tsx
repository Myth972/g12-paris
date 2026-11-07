import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAiProvider } from "@/hooks/useAiProvider";

type AIProviderSelectProps = {
  className?: string;
  showTestButton?: boolean;
  size?: "sm" | "md";
};

export function AIProviderSelect({
  className,
  showTestButton = true,
  size = "sm",
}: AIProviderSelectProps) {
  const { providers, provider, setProvider, testProvider, isTesting } =
    useAiProvider();

  // Le trigger prend la largeur disponible et se replie au lieu d'imposer une
  // largeur fixe : dans une sidebar étroite (340px) ou sur mobile, l'ancien
  // min-w-[200px] + bouton « Tester l'IA » débordait de la carte.
  const triggerClass =
    size === "sm" ? "h-8 w-full min-w-0 text-xs" : "h-9 w-full min-w-0 text-sm";

  return (
    <div
      className={`flex min-w-0 flex-wrap items-center gap-2 ${className ?? ""}`}
    >
      <div className="min-w-0 flex-1 basis-[180px]">
        <Select
          value={provider}
          onValueChange={value => setProvider(value as any)}
        >
          <SelectTrigger className={triggerClass}>
            <SelectValue className="truncate" />
          </SelectTrigger>
          <SelectContent>
            {providers.map(p => (
              <SelectItem key={p.value} value={p.value}>
                {p.label} — {p.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showTestButton && (
        <Button
          variant="outline"
          size={size === "sm" ? "sm" : "default"}
          className="shrink-0"
          onClick={() => testProvider()}
          disabled={isTesting}
        >
          {isTesting ? "Test..." : "Tester l'IA"}
        </Button>
      )}
    </div>
  );
}

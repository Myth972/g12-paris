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

  const triggerClass =
    size === "sm" ? "h-8 text-xs min-w-[200px]" : "h-9 min-w-[220px]";

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Select
        value={provider}
        onValueChange={value => setProvider(value as any)}
      >
        <SelectTrigger className={triggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {providers.map(p => (
            <SelectItem key={p.value} value={p.value}>
              {p.label} — {p.model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showTestButton && (
        <Button
          variant="outline"
          size={size === "sm" ? "sm" : "default"}
          onClick={() => testProvider()}
          disabled={isTesting}
        >
          {isTesting ? "Test..." : "Tester l'IA"}
        </Button>
      )}
    </div>
  );
}

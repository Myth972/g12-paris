import { useDevDeviceMode } from "@/hooks/useDevDeviceMode";
import { cn } from "@/lib/utils";

const MODES = [
  { value: "auto", label: "Auto" },
  { value: "desktop", label: "Ordi" },
  { value: "mobile", label: "Tél" },
] as const;

export default function DevDeviceToggle() {
  const { mode, setMode } = useDevDeviceMode();

  return (
    <div className="fixed bottom-6 left-6 z-[60] rounded-full bg-foreground/95 text-background shadow-lg backdrop-blur-md border border-foreground/10 px-2 py-1 flex items-center gap-1">
      <span className="text-[10px] uppercase tracking-widest font-bold px-2">
        Mode
      </span>
      <div className="flex items-center gap-1">
        {MODES.map(item => (
          <button
            key={item.value}
            type="button"
            onClick={() => setMode(item.value)}
            className={cn(
              "text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors",
              mode === item.value
                ? "bg-white text-foreground"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

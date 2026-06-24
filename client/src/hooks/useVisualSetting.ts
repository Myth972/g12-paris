import { trpc } from "@/lib/trpc";

type Defaults = Record<string, string>;

const defaults: Defaults = {
  "visuals.particles.enabled": "true",
  "visuals.particles.count": "40",
  "visuals.particles.speed": "0.25",
  "visuals.particles.color": "#FCD34D",
  "visuals.glowCursor.enabled": "true",
  "visuals.pageTransition.enabled": "true",
  "visuals.tiltCard.enabled": "true",
  "visuals.progressBar.enabled": "true",
  "visuals.scrollToTop.enabled": "true",
  "visuals.reveal.enabled": "true",
  "visuals.stats.enabled": "true",
};

export function useVisualSetting(key: string): string {
  const { data } = trpc.siteSettings.getAll.useQuery(undefined, {
    staleTime: 30_000,
  });
  return (data?.[key] as string) ?? defaults[key] ?? "";
}

export function useVisualEnabled(key: string): boolean {
  return useVisualSetting(key) !== "false";
}

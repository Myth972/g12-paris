import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  AI_PROVIDERS,
  type AiProvider,
  getProviderInfo,
} from "../../../shared/aiProviders.js";
import { toast } from "sonner";

export function useAiProvider() {
  const providerSetting = trpc.siteSettings.get.useQuery({
    key: "aiProvider",
  });

  const setProviderMutation = trpc.siteSettings.set.useMutation({
    onSuccess: () => toast.success("Fournisseur IA mis à jour"),
    onError: error => toast.error("Erreur IA: " + error.message),
  });

  const testProviderMutation = trpc.ai.testProvider.useMutation({
    onSuccess: data => {
      toast.success(`IA OK (${data.provider}) – modèle: ${data.model}`);
    },
    onError: error => toast.error("Test IA échoué: " + error.message),
  });

  const [provider, setProvider] = useState<AiProvider>("groq");

  useEffect(() => {
    const value = providerSetting.data;
    const validProviders = AI_PROVIDERS.map(p => p.value);
    if (value && validProviders.includes(value as AiProvider)) {
      setProvider(value as AiProvider);
    }
  }, [providerSetting.data]);

  const activeProvider = getProviderInfo(provider);

  const setProviderAndPersist = (next: AiProvider) => {
    setProvider(next);
    setProviderMutation.mutate({ key: "aiProvider", value: next });
  };

  const testProvider = (value?: AiProvider) => {
    testProviderMutation.mutate({ provider: value ?? provider });
  };

  return {
    providers: AI_PROVIDERS,
    provider,
    activeProvider,
    setProvider: setProviderAndPersist,
    isSaving: setProviderMutation.isPending,
    testProvider,
    isTesting: testProviderMutation.isPending,
  };
}

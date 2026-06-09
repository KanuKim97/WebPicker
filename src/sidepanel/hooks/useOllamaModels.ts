import { useCallback, useEffect, useState } from "react";
import type { Translator } from "../i18n";
import type { Settings } from "../types/Settings";
import type { OllamaModel } from "../types/OllamaModel";

const OLLAMA_BASE_URL = "http://localhost:11434";

type UseOllamaModelOptions = {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  enabled: boolean;
  t: Translator;
};

export function useOllamaModels({
  settings,
  updateSettings,
  enabled,
  t,
}: UseOllamaModelOptions) {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [modelError, setModelError] = useState("");
  const [isModelLoading, setIsModelLoading] = useState(true);

  const selectedModel = settings.model || models[0]?.name || "";

  const loadModels = useCallback(async () => {
    setIsModelLoading(true);
    setModelError("");

    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);

      if (!response.ok) {
        throw new Error(t("ollamaResponseError", { status: response.status }));
      }

      const data = (await response.json()) as { models?: OllamaModel[] };
      const nextModels = data.models ?? [];
      setModels(nextModels);

      const nextModel = settings.model || nextModels[0]?.name || "";

      if (nextModel !== settings.model) {
        updateSettings({ model: nextModel });
      }
    } catch (error) {
      setModelError(getOllamaErrorMessage(error, t));
    } finally {
      setIsModelLoading(false);
    }
  }, [settings.model, t, updateSettings]);

  useEffect(() => {
    if (!enabled) return;
    loadModels();
  }, [enabled, loadModels]);

  return {
    models,
    modelError,
    isModelLoading,
    selectedModel,
    loadModels,
  };
}

function getOllamaErrorMessage(error: unknown, t: Translator): string {
  const message =
    error instanceof Error ? error.message : t("unknownError");
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
    return t("ollamaUnavailable");
  }
  return message;
}

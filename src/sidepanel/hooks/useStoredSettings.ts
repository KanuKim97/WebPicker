import { useCallback, useEffect, useState } from "react";
import { isLocale } from "../i18n";
import { defaultSettings, type Settings } from "../types/Settings";

const SETTINGS_KEY = "osa-settings";

export function useStoredSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState<boolean>(false);

  useEffect(() => {
    let isCanceled = false;

    async function load() {
      if (typeof chrome === "undefined" || !chrome.storage?.local) {
        setIsSettingsLoaded(true);
        return;
      }

      const stored = await chrome.storage.local.get(SETTINGS_KEY);
      const value = stored[SETTINGS_KEY] as Partial<Settings> | undefined;

      if (!isCanceled) {
        const uiLanguage = isLocale(value?.uiLanguage)
          ? value.uiLanguage
          : defaultSettings.uiLanguage;
        setSettings({
          model: value?.model ?? defaultSettings.model,
          uiLanguage,
          includePageContext:
            value?.includePageContext ?? defaultSettings.includePageContext,
        });
        setIsSettingsLoaded(true);
      }
    }

    load().catch(() => {
      if (!isCanceled) {
        setIsSettingsLoaded(true);
      }
    });

    return () => {
      isCanceled = true;
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local
          .set({ [SETTINGS_KEY]: next })
          .catch(() => undefined);
      }
      return next;
    });
  }, []);

  return { settings, isSettingsLoaded, updateSettings };
}

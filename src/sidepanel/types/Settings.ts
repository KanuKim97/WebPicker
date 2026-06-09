import type { Locale } from "../i18n";

type Settings = {
  model: string;
  uiLanguage: Locale;
  includePageContext: boolean;
};

export const defaultSettings: Settings = {
  model: "",
  uiLanguage: "en",
  includePageContext: true,
};

export type { Settings };

import { Bot, Languages } from "lucide-react";
import type { Locale, Translator } from "../i18n";

type AppHeaderProps = {
  model: string;
  isLoading: boolean;
  hasError: boolean;
  locale: Locale;
  t: Translator;
  onLocaleChange: (locale: Locale) => void;
};

export function AppHeader({
  model,
  isLoading,
  hasError,
  locale,
  t,
  onLocaleChange,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-brand">
        <img src="./brand/webpicker-mark.svg" alt="" className="app-brand-mark" />
        <h1>WebPicker</h1>
      </div>
      <div className="header-actions">
        <button
          type="button"
          className="language-toggle"
          aria-label={t("languageLabel")}
          title={t("languageLabel")}
          onClick={() => onLocaleChange(locale === "en" ? "ko" : "en")}
        >
          <Languages size={14} />
          <span>{locale.toUpperCase()}</span>
        </button>
        <div className={hasError ? "model-chip danger" : "model-chip"}>
          <span className="status-dot" />
          <Bot size={15} />
          <span>{isLoading ? t("modelChecking") : model || t("noModel")}</span>
        </div>
      </div>
    </header>
  );
}

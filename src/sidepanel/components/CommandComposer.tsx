import {
  ArrowLeft,
  Check,
  ChevronRight,
  MessageSquareText,
  Plus,
  Search,
  Send,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { getSlashCommands } from "../commands/slashCommands";
import type { Locale, Translator } from "../i18n";
import type { OllamaModel } from "../types/OllamaModel";
import type { SlashCommand } from "../types/SlashCommand";

type PaletteView =
  | "models"
  | "context"
  | "language"
  | "new-chat"
  | "reload"
  | null;

type CommandComposerProps = {
  input: string;
  canSubmit: boolean;
  busy: boolean;
  models: OllamaModel[];
  selectedModel: string;
  includePageContext: boolean;
  locale: Locale;
  t: Translator;
  onInputChange: (value: string) => void;
  onSubmitText: (value: string) => void;
  onRunCommand: (command: SlashCommand) => void;
  onModelChange: (model: string) => void;
  onContextChange: (include: boolean) => void;
  onLocaleChange: (locale: Locale) => void;
  onNewChat: () => void;
  onReload: () => void;
};

export function CommandComposer({
  input,
  canSubmit,
  busy,
  models,
  selectedModel,
  includePageContext,
  locale,
  t,
  onInputChange,
  onSubmitText,
  onRunCommand,
  onModelChange,
  onContextChange,
  onLocaleChange,
  onNewChat,
  onReload,
}: CommandComposerProps) {
  const [paletteView, setPaletteView] = useState<PaletteView>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [modelQuery, setModelQuery] = useState("");
  const slashCommands = useMemo(() => getSlashCommands(locale), [locale]);

  const trimmedStart = input.trimStart();
  const commandQuery = trimmedStart.slice(1).toLowerCase();
  const isCommandQuery =
    trimmedStart.startsWith("/") && !/\s/.test(trimmedStart);

  const filteredCommands = useMemo(() => {
    if (!isCommandQuery) return [];

    return slashCommands.filter((command) =>
      [
        command.command.slice(1),
        command.label,
        command.description,
        ...command.aliases.map((alias) => alias.slice(1)),
      ].some((value) => value.toLowerCase().includes(commandQuery)),
    );
  }, [commandQuery, isCommandQuery, slashCommands]);

  const filteredModels = useMemo(() => {
    const query = modelQuery.trim().toLowerCase();
    if (!query) return models;
    return models.filter((model) => model.name.toLowerCase().includes(query));
  }, [modelQuery, models]);

  const isPaletteOpen = paletteView !== null || isCommandQuery;

  useEffect(() => {
    setSelectedIndex(0);
  }, [commandQuery]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (paletteView || !input.trim()) return;
    onSubmitText(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;

    if (paletteView) {
      if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
      }
      return;
    }

    if (!isCommandQuery || filteredCommands.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => (current + 1) % filteredCommands.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex(
        (current) =>
          (current - 1 + filteredCommands.length) % filteredCommands.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectCommand(filteredCommands[selectedIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onInputChange("");
    }
  }

  function selectCommand(command: SlashCommand) {
    if (command.id === "model") {
      setPaletteView("models");
      setModelQuery("");
      return;
    }
    if (command.id === "context") {
      setPaletteView("context");
      return;
    }
    if (command.id === "language") {
      setPaletteView("language");
      return;
    }
    if (command.id === "new-chat" || command.id === "reload") {
      setPaletteView(command.id);
      return;
    }
    if (command.id === "summary") {
      onRunCommand(command);
      closePalette();
      return;
    }

    onInputChange(`${command.command} `);
    setPaletteView(null);
  }

  function closePalette() {
    setPaletteView(null);
    setModelQuery("");
    onInputChange("");
  }

  function selectModel(model: string) {
    onModelChange(model);
    closePalette();
  }

  return (
    <div className="composer-shell">
      {isPaletteOpen && (
        <div className="command-palette">
          {paletteView === null && (
            <CommandList
              commands={filteredCommands}
              selectedIndex={selectedIndex}
              t={t}
              onHover={setSelectedIndex}
              onSelect={selectCommand}
            />
          )}

          {paletteView === "models" && (
            <>
              <PaletteHeader
                title={t("chooseModel")}
                backLabel={t("backToCommands")}
                onBack={() => setPaletteView(null)}
              />
              <label className="palette-search">
                <Search size={15} />
                <input
                  autoFocus
                  value={modelQuery}
                  onChange={(event) => setModelQuery(event.target.value)}
                  placeholder={t("searchModels")}
                />
              </label>
              <div className="palette-options">
                {filteredModels.length === 0 && (
                  <p className="palette-empty">{t("noInstalledModels")}</p>
                )}
                {filteredModels.map((model) => (
                  <button
                    key={model.name}
                    type="button"
                    className="palette-option"
                    onClick={() => selectModel(model.name)}
                  >
                    <span className="option-copy">
                      <strong>{model.name}</strong>
                      <span>{formatModelMeta(model)}</span>
                    </span>
                    {model.name === selectedModel && <Check size={16} />}
                  </button>
                ))}
              </div>
            </>
          )}

          {paletteView === "context" && (
            <>
              <PaletteHeader
                title={t("pageContextTitle")}
                backLabel={t("backToCommands")}
                onBack={() => setPaletteView(null)}
              />
              <div className="palette-options">
                <ContextOption
                  title={t("includePage")}
                  description={t("includePageDescription")}
                  selected={includePageContext}
                  onClick={() => {
                    onContextChange(true);
                    closePalette();
                  }}
                />
                <ContextOption
                  title={t("excludePage")}
                  description={t("excludePageDescription")}
                  selected={!includePageContext}
                  onClick={() => {
                    onContextChange(false);
                    closePalette();
                  }}
                />
              </div>
            </>
          )}

          {paletteView === "language" && (
            <>
              <PaletteHeader
                title={t("chooseLanguage")}
                backLabel={t("backToCommands")}
                onBack={() => setPaletteView(null)}
              />
              <div className="palette-options">
                <ContextOption
                  title={t("languageEnglish")}
                  description={t("languageEnglishDescription")}
                  selected={locale === "en"}
                  onClick={() => {
                    onLocaleChange("en");
                    closePalette();
                  }}
                />
                <ContextOption
                  title={t("languageKorean")}
                  description={t("languageKoreanDescription")}
                  selected={locale === "ko"}
                  onClick={() => {
                    onLocaleChange("ko");
                    closePalette();
                  }}
                />
              </div>
            </>
          )}

          {paletteView === "new-chat" && (
            <ConfirmView
              title={t("newChatQuestion")}
              description={t("newChatDescription")}
              confirmLabel={t("newChat")}
              cancelLabel={t("cancel")}
              onCancel={closePalette}
              onConfirm={() => {
                onNewChat();
                closePalette();
              }}
            />
          )}

          {paletteView === "reload" && (
            <ConfirmView
              title={t("reloadQuestion")}
              description={t("reloadDescription")}
              confirmLabel={t("reload")}
              cancelLabel={t("cancel")}
              onCancel={closePalette}
              onConfirm={onReload}
            />
          )}
        </div>
      )}

      <form className="command-composer" onSubmit={handleSubmit}>
        <button
          type="button"
          className="composer-icon-button"
          title={t("openCommands")}
          onClick={() => {
            setPaletteView(null);
            onInputChange("/");
          }}
        >
          <Plus size={19} />
        </button>
        <div className="composer-input-wrap">
          <MessageSquareText size={17} />
          <input
            role="combobox"
            aria-expanded={isPaletteOpen}
            aria-label={t("inputLabel")}
            value={input}
            onChange={(event) => {
              setPaletteView(null);
              onInputChange(event.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t("inputPlaceholder")}
          />
        </div>
        <button
          className="composer-send-button"
          disabled={!canSubmit || busy || !input.trim() || isCommandQuery}
          title={t("send")}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

function CommandList({
  commands,
  selectedIndex,
  t,
  onHover,
  onSelect,
}: {
  commands: SlashCommand[];
  selectedIndex: number;
  t: Translator;
  onHover: (index: number) => void;
  onSelect: (command: SlashCommand) => void;
}) {
  if (commands.length === 0) {
    return <p className="palette-empty">{t("noMatchingCommands")}</p>;
  }

  let previousGroup = "";

  return (
    <div className="command-list" role="listbox">
      {commands.map((command, index) => {
        const Icon = command.icon;
        const showGroup = command.group !== previousGroup;
        previousGroup = command.group;

        return (
          <div key={command.id}>
            {showGroup && (
              <p className="command-group">
                {t(
                  command.group === "task"
                    ? "groupTask"
                    : command.group === "settings"
                      ? "groupSettings"
                      : "groupManagement",
                )}
              </p>
            )}
            <button
              type="button"
              role="option"
              aria-selected={selectedIndex === index}
              className={
                selectedIndex === index
                  ? "command-item selected"
                  : "command-item"
              }
              onMouseEnter={() => onHover(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(command)}
            >
              <span className="command-icon">
                <Icon size={17} />
              </span>
              <span className="command-copy">
                <strong>{command.label}</strong>
                <span>{command.description}</span>
              </span>
              <ChevronRight size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function PaletteHeader({
  title,
  backLabel,
  onBack,
}: {
  title: string;
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <div className="palette-header">
      <button type="button" aria-label={backLabel} onClick={onBack}>
        <ArrowLeft size={16} />
      </button>
      <strong>{title}</strong>
    </div>
  );
}

function ContextOption({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="palette-option" onClick={onClick}>
      <span className="option-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      {selected && <Check size={16} />}
    </button>
  );
}

function ConfirmView({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="confirm-view">
      <strong>{title}</strong>
      <p>{description}</p>
      <div className="confirm-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="primary-button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

function formatModelMeta(model: OllamaModel): string {
  const details = [
    model.details?.family,
    model.details?.parameter_size,
    model.details?.quantization_level,
    model.size ? formatBytes(model.size) : "",
  ].filter(Boolean);

  return details.join(" · ") || "Ollama";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

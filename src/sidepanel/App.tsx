import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CaptureResponse,
  DomAction,
  DomActionResponse,
  DomTargetsResponse,
  ExtensionRequest,
  PageTextResponse,
  SelectionResponse,
} from "../types/messages";
import { findSlashCommand } from "./commands/slashCommands";
import { AppHeader } from "./components/AppHeader";
import { CommandComposer } from "./components/CommandComposer";
import { ConversationView } from "./components/ConversationView";
import { useOllamaModels } from "./hooks/useOllamaModels";
import { useStoredSettings } from "./hooks/useStoredSettings";
import { createTranslator, type Translator } from "./i18n";
import type { ChatMessage } from "./types/ChatMessage";
import type { ConversationEntry } from "./types/ConversationEntry";
import type { ProposedAction } from "./types/ProposedAction";
import type { SlashCommand } from "./types/SlashCommand";

const OLLAMA_BASE_URL = "http://localhost:11434";
const PAGE_CONTEXT_LIMIT = 18000;

export function App() {
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<ConversationEntry[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [selectionText, setSelectionText] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [proposedAction, setProposedAction] =
    useState<ProposedAction | null>(null);
  const [actionStatus, setActionStatus] = useState("");

  const streamAbortRef = useRef<AbortController | null>(null);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  const { settings, isSettingsLoaded, updateSettings } = useStoredSettings();
  const t = useMemo(
    () => createTranslator(settings.uiLanguage),
    [settings.uiLanguage],
  );
  const {
    models,
    modelError,
    isModelLoading,
    selectedModel,
  } = useOllamaModels({
    settings,
    updateSettings,
    enabled: isSettingsLoaded,
    t,
  });

  const canSubmit = Boolean(selectedModel) && !isBusy;

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) return;

    const handleRuntimeMessage = (message: unknown) => {
      const event = message as { type?: string; payload?: { text?: string } };
      if (event.type === "SELECTION_UPDATED" && event.payload?.text) {
        setSelectionText(event.payload.text);
      }
    };

    chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    return () => chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
  }, []);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ block: "end" });
  }, [entries, proposedAction, actionStatus]);

  useEffect(() => {
    document.documentElement.lang = settings.uiLanguage;
  }, [settings.uiLanguage]);

  function handleRunCommand(command: SlashCommand) {
    if (!selectedModel) {
      appendStatus(t("selectModelFirst"));
      return;
    }

    if (command.id === "summary") {
      void summarizePage("");
    }
  }

  function handleSubmitText(value: string) {
    const trimmed = value.trim();
    if (!trimmed || !canSubmit) return;

    if (!trimmed.startsWith("/")) {
      void sendChat(trimmed);
      return;
    }

    const [token, ...argumentParts] = trimmed.split(/\s+/);
    const command = findSlashCommand(token, settings.uiLanguage);
    const argument = argumentParts.join(" ").trim();

    if (!command) {
      appendStatus(t("unknownCommand", { command: token }));
      setInput("");
      return;
    }

    switch (command.id) {
      case "summary":
        void summarizePage(argument);
        break;
      case "translate":
        void translateSelectionOrPage(argument);
        break;
      case "screenshot":
        void captureAndAnalyze(argument);
        break;
      case "automation":
        if (!argument) {
          appendStatus(t("automationRequiresInstruction"));
          return;
        }
        void planAutomation(argument);
        break;
      case "model":
      case "context":
      case "language":
      case "new-chat":
      case "reload":
        appendStatus(
          t("selectCommandFromPalette", { command: command.label }),
        );
        break;
    }

    setInput("");
  }

  async function sendChat(text: string) {
    const userMessage: ChatMessage = { role: "user", content: text };
    const nextHistory = [...chatHistory, userMessage];
    const responseId = createId();

    appendUser(text);
    appendAssistant(responseId, t("answerTitle"), "");
    setInput("");
    setIsBusy(true);

    try {
      const contextMessages: ChatMessage[] = [];
      if (settings.includePageContext) {
        const page = await requestPageText();
        if (page.ok) {
          contextMessages.push({
            role: "system",
            content: t("pageContext", {
              title: page.title,
              url: page.url,
              body: clipText(page.text, PAGE_CONTEXT_LIMIT, t),
            }),
          });
        }
      }

      const messages: ChatMessage[] = [
        {
          role: "system",
          content: t("chatSystem"),
        },
        ...contextMessages,
        ...nextHistory,
      ];

      let assistantText = "";
      await streamOllama({
        model: selectedModel,
        messages,
        onDelta: (delta) => {
          assistantText += delta;
          updateEntry(responseId, assistantText, true);
        },
      });

      setChatHistory([
        ...nextHistory,
        { role: "assistant", content: assistantText },
      ]);
      updateEntry(responseId, assistantText, false);
    } catch (error) {
      updateEntry(responseId, toErrorText(error, t), false);
    } finally {
      setIsBusy(false);
    }
  }

  async function summarizePage(instruction: string) {
    if (!selectedModel || isBusy) return;

    const responseId = createId();
    const command = findSlashCommand("/summary", settings.uiLanguage)!;
    appendUser(instruction ? `${command.command} ${instruction}` : command.command);
    appendAssistant(responseId, t("pageSummaryTitle"), "");
    setInput("");
    setIsBusy(true);

    try {
      const page = await requestPageText();
      if (!page.ok) throw new Error(page.error);

      const extraInstruction = instruction
        ? t("additionalRequest", { instruction })
        : "";
      let result = "";

      await streamOllama({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: t("summarySystem") + extraInstruction,
          },
          {
            role: "user",
            content: t("pageContent", {
              title: page.title,
              url: page.url,
              body: clipText(page.text, PAGE_CONTEXT_LIMIT, t),
            }),
          },
        ],
        onDelta: (delta) => {
          result += delta;
          updateEntry(responseId, result, true);
        },
      });

      updateEntry(responseId, result, false);
    } catch (error) {
      updateEntry(responseId, toErrorText(error, t), false);
    } finally {
      setIsBusy(false);
    }
  }

  async function translateSelectionOrPage(instruction: string) {
    if (!selectedModel || isBusy) return;

    const command = findSlashCommand("/translate", settings.uiLanguage)!;
    const commandText = instruction
      ? `${command.command} ${instruction}`
      : command.command;
    const responseId = createId();
    appendUser(commandText);
    appendAssistant(responseId, t("translationTitle"), "");
    setInput("");
    setIsBusy(true);

    try {
      const selection = await requestSelection();
      let source = selection.ok ? selection.text : selectionText;

      if (!source) {
        const page = await requestPageText();
        if (!page.ok) throw new Error(page.error);
        source = page.text;
      }

      setSelectionText(source);
      const targetInstruction =
        instruction || t("naturalTranslation");
      let result = "";

      await streamOllama({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: t("translationSystem"),
          },
          {
            role: "user",
            content: t("translationRequest", {
              instruction: targetInstruction,
              source: clipText(source, PAGE_CONTEXT_LIMIT, t),
            }),
          },
        ],
        onDelta: (delta) => {
          result += delta;
          updateEntry(responseId, result, true);
        },
      });

      updateEntry(responseId, result, false);
    } catch (error) {
      updateEntry(responseId, toErrorText(error, t), false);
    } finally {
      setIsBusy(false);
    }
  }

  async function captureAndAnalyze(question: string) {
    if (!selectedModel || isBusy) return;

    const prompt = question || t("screenshotDefault");
    const command = findSlashCommand("/screenshot", settings.uiLanguage)!;
    const responseId = createId();
    appendUser(question ? `${command.command} ${question}` : command.command);
    appendAssistant(responseId, t("screenshotAnalysisTitle"), "");
    setInput("");
    setIsBusy(true);

    try {
      const capture = await sendRuntimeMessage<CaptureResponse>({
        type: "CAPTURE_VISIBLE_TAB",
        locale: settings.uiLanguage,
      });
      if (!capture.ok) throw new Error(capture.error);

      updateEntryImage(responseId, capture.dataUrl);
      let result = "";

      await streamOllama({
        model: selectedModel,
        messages: [{ role: "user", content: prompt }],
        images: [extractBase64(capture.dataUrl)],
        onDelta: (delta) => {
          result += delta;
          updateEntry(responseId, result, true);
        },
      });

      updateEntry(responseId, result, false);
    } catch (error) {
      updateEntry(
        responseId,
        `${toErrorText(error, t)}\n\n${t("imageSupportHint")}`,
        false,
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function planAutomation(request: string) {
    if (!selectedModel || isBusy) return;

    const responseId = createId();
    const command = findSlashCommand("/automation", settings.uiLanguage)!;
    appendUser(`${command.command} ${request}`);
    appendAssistant(responseId, t("automationPlanTitle"), "");
    setProposedAction(null);
    setActionStatus("");
    setInput("");
    setIsBusy(true);

    try {
      const targetsResponse = await sendRuntimeMessage<DomTargetsResponse>({
        type: "GET_DOM_TARGETS",
        locale: settings.uiLanguage,
      });
      if (!targetsResponse.ok) throw new Error(targetsResponse.error);

      const page = await requestPageText();
      const pageSummary = page.ok
        ? clipText(page.text, 5000, t)
        : t("pageUnavailable");
      const targetList = targetsResponse.targets
        .map(
          (target) =>
            `${target.id} | ${target.kind} | ${target.label} | ` +
            `${target.href ?? target.text}`,
        )
        .join("\n");

      let result = "";
      await streamOllama({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: t("automationSystem"),
          },
          {
            role: "user",
            content: t("automationRequest", {
              request,
              summary: pageSummary,
              targets: targetList || t("noCandidates"),
            }),
          },
        ],
        onDelta: (delta) => {
          result += delta;
          updateEntry(responseId, stripActionJson(result), true);
        },
      });

      const parsed = parseProposedAction(result, t);
      updateEntry(responseId, stripActionJson(result), false);

      if (parsed) {
        setProposedAction(parsed);
      } else {
        setActionStatus(t("noActionFound"));
      }
    } catch (error) {
      updateEntry(responseId, toErrorText(error, t), false);
    } finally {
      setIsBusy(false);
    }
  }

  async function executeProposedAction() {
    if (!proposedAction) return;

    setActionStatus(t("actionExecuting"));
    const response = await sendRuntimeMessage<DomActionResponse>({
      type: "EXECUTE_DOM_ACTION",
      locale: settings.uiLanguage,
      payload: proposedAction.action,
    });

    setActionStatus(response.ok ? response.message : response.error);
    if (response.ok) setProposedAction(null);
  }

  function startNewChat() {
    stopStreaming();
    setEntries([]);
    setChatHistory([]);
    setSelectionText("");
    setProposedAction(null);
    setActionStatus("");
  }

  function stopStreaming() {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    setIsBusy(false);
    setEntries((current) =>
      current.map((entry) =>
        entry.pending ? { ...entry, pending: false } : entry,
      ),
    );
  }

  function appendUser(content: string) {
    setEntries((current) => [
      ...current,
      { id: createId(), role: "user", content },
    ]);
  }

  function appendAssistant(id: string, title: string, content: string) {
    setEntries((current) => [
      ...current,
      { id, role: "assistant", title, content, pending: true },
    ]);
  }

  function appendStatus(content: string) {
    setEntries((current) => [
      ...current,
      { id: createId(), role: "status", content },
    ]);
  }

  function updateEntry(id: string, content: string, pending: boolean) {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, content, pending } : entry,
      ),
    );
  }

  function updateEntryImage(id: string, imageUrl: string) {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, imageUrl } : entry,
      ),
    );
  }

  return (
    <main className="app-shell">
      <AppHeader
        model={selectedModel}
        isLoading={isModelLoading}
        hasError={Boolean(modelError)}
        locale={settings.uiLanguage}
        t={t}
        onLocaleChange={(uiLanguage) =>
          updateSettings({ uiLanguage })
        }
      />

      <ConversationView
        entries={entries}
        busy={isBusy}
        modelError={modelError}
        proposedAction={proposedAction}
        actionStatus={actionStatus}
        t={t}
        endRef={conversationEndRef}
        onStop={stopStreaming}
        onExecuteAction={executeProposedAction}
        onDismissAction={() => setProposedAction(null)}
      />

      <CommandComposer
        input={input}
        canSubmit={canSubmit}
        busy={isBusy}
        models={models}
        selectedModel={selectedModel}
        includePageContext={settings.includePageContext}
        locale={settings.uiLanguage}
        t={t}
        onInputChange={setInput}
        onSubmitText={handleSubmitText}
        onRunCommand={handleRunCommand}
        onModelChange={(model) => updateSettings({ model })}
        onContextChange={(includePageContext) =>
          updateSettings({ includePageContext })
        }
        onLocaleChange={(uiLanguage) => updateSettings({ uiLanguage })}
        onNewChat={startNewChat}
        onReload={() => {
          if (typeof chrome !== "undefined" && chrome.runtime?.reload) {
            chrome.runtime.reload();
          } else {
            window.location.reload();
          }
        }}
      />
    </main>
  );

  async function requestPageText(): Promise<PageTextResponse> {
    return sendRuntimeMessage<PageTextResponse>({
      type: "GET_PAGE_TEXT",
      locale: settings.uiLanguage,
    });
  }

  async function requestSelection(): Promise<SelectionResponse> {
    return sendRuntimeMessage<SelectionResponse>({
      type: "GET_SELECTION",
      locale: settings.uiLanguage,
    });
  }

  async function streamOllama(options: {
    model: string;
    messages: ChatMessage[];
    images?: string[];
    onDelta: (delta: string) => void;
  }) {
    streamAbortRef.current?.abort();
    const abortController = new AbortController();
    streamAbortRef.current = abortController;

    const messages = options.images?.length
      ? options.messages.map((message, index) =>
          index === options.messages.length - 1
            ? { ...message, images: options.images }
            : message,
        )
      : options.messages;

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: options.model,
        messages,
        stream: true,
      }),
      signal: abortController.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(t("ollamaResponseError", { status: response.status }));
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const chunk = JSON.parse(trimmed) as {
          message?: { content?: string };
          error?: string;
        };
        if (chunk.error) throw new Error(chunk.error);
        if (chunk.message?.content) options.onDelta(chunk.message.content);
      }
    }
  }
}

function sendRuntimeMessage<TResponse>(
  message: ExtensionRequest,
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      const t = createTranslator(message.locale);
      reject(new Error(t("chromeOnly")));
      return;
    }

    chrome.runtime.sendMessage<TResponse>(message, (response) => {
      const error = chrome.runtime.lastError?.message;
      if (error) {
        reject(new Error(error));
        return;
      }
      resolve(response);
    });
  });
}

function parseProposedAction(
  text: string,
  t: Translator,
): ProposedAction | null {
  const marker = "ACTION_JSON:";
  const markerIndex = text.lastIndexOf(marker);
  if (markerIndex < 0) return null;

  const jsonText = text.slice(markerIndex + marker.length).trim();
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as DomAction;
    if (!isValidAction(parsed)) return null;
    return {
      action: parsed,
      explanation:
        text.slice(0, markerIndex).trim() ||
        t("proposedActionFallback"),
    };
  } catch {
    return null;
  }
}

function stripActionJson(text: string): string {
  const markerIndex = text.lastIndexOf("ACTION_JSON:");
  return markerIndex < 0 ? text : text.slice(0, markerIndex).trim();
}

function isValidAction(value: DomAction): value is DomAction {
  if (!value || typeof value !== "object") return false;
  if (value.action === "fill_input") {
    return (
      typeof value.targetId === "string" && typeof value.value === "string"
    );
  }
  if (value.action === "click_element") {
    return typeof value.targetId === "string";
  }
  if (value.action === "navigate_to") {
    return typeof value.url === "string";
  }
  return false;
}

function extractBase64(dataUrl: string): string {
  return dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
}

function clipText(text: string, limit: number, t: Translator): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n\n${t("clippedText", { limit })}`;
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toErrorText(error: unknown, t: Translator): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return t("requestStopped");
  }
  if (error instanceof Error) return error.message;
  return t("unknownError");
}

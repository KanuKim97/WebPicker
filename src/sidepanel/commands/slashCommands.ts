import {
  Bot,
  Camera,
  Globe2,
  Languages,
  MessageSquarePlus,
  MousePointerClick,
  RefreshCw,
  ScanText,
  Sparkles,
} from "lucide-react";
import type { Locale } from "../i18n";
import type {
  CommandGroup,
  CommandId,
  SlashCommand,
} from "../types/SlashCommand";

type CommandDefinition = {
  id: CommandId;
  group: CommandGroup;
  icon: SlashCommand["icon"];
  ko: Pick<SlashCommand, "command" | "label" | "description">;
  en: Pick<SlashCommand, "command" | "label" | "description">;
  extraAliases?: string[];
};

const commandDefinitions: CommandDefinition[] = [
  {
    id: "summary",
    group: "task",
    icon: Sparkles,
    ko: {
      command: "/요약",
      label: "요약",
      description: "현재 페이지의 핵심 내용을 정리합니다",
    },
    en: {
      command: "/summary",
      label: "Summary",
      description: "Summarize the key points of the current page",
    },
  },
  {
    id: "translate",
    group: "task",
    icon: Languages,
    ko: {
      command: "/번역",
      label: "번역",
      description: "선택한 내용이나 현재 페이지를 번역합니다",
    },
    en: {
      command: "/translate",
      label: "Translate",
      description: "Translate selected text or the current page",
    },
  },
  {
    id: "screenshot",
    group: "task",
    icon: Camera,
    ko: {
      command: "/스크린샷",
      label: "스크린샷",
      description: "현재 화면을 캡처하고 분석합니다",
    },
    en: {
      command: "/screenshot",
      label: "Screenshot",
      description: "Capture and analyze the current screen",
    },
  },
  {
    id: "automation",
    group: "task",
    icon: MousePointerClick,
    ko: {
      command: "/자동화",
      label: "자동화",
      description: "현재 페이지에서 수행할 작업을 계획합니다",
    },
    en: {
      command: "/automation",
      label: "Automation",
      description: "Plan an action on the current page",
    },
  },
  {
    id: "model",
    group: "settings",
    icon: Bot,
    ko: {
      command: "/모델",
      label: "모델",
      description: "Ollama에 설치된 활성 모델을 선택합니다",
    },
    en: {
      command: "/model",
      label: "Model",
      description: "Choose an installed Ollama model",
    },
  },
  {
    id: "context",
    group: "settings",
    icon: ScanText,
    ko: {
      command: "/컨텍스트",
      label: "컨텍스트",
      description: "현재 페이지를 대화에 포함할지 설정합니다",
    },
    en: {
      command: "/context",
      label: "Context",
      description: "Choose whether to include the current page",
    },
    extraAliases: ["/컨택스트"],
  },
  {
    id: "language",
    group: "settings",
    icon: Globe2,
    ko: {
      command: "/언어",
      label: "언어 설정",
      description: "화면과 AI 응답 언어를 변경합니다",
    },
    en: {
      command: "/language",
      label: "Language",
      description: "Change the interface and AI response language",
    },
    extraAliases: ["/lang"],
  },
  {
    id: "new-chat",
    group: "management",
    icon: MessageSquarePlus,
    ko: {
      command: "/새대화",
      label: "새 대화",
      description: "대화와 현재 작업 결과를 초기화합니다",
    },
    en: {
      command: "/new",
      label: "New chat",
      description: "Clear the conversation and current task results",
    },
  },
  {
    id: "reload",
    group: "management",
    icon: RefreshCw,
    ko: {
      command: "/새로고침",
      label: "플러그인 새로고침",
      description: "WebPicker 확장 프로그램을 다시 로드합니다",
    },
    en: {
      command: "/reload",
      label: "Reload extension",
      description: "Reload the WebPicker extension",
    },
  },
];

export function getSlashCommands(locale: Locale): SlashCommand[] {
  return commandDefinitions.map((definition) => {
    const localized = definition[locale];
    const aliases = [
      definition.ko.command,
      definition.en.command,
      ...(definition.extraAliases ?? []),
    ].filter((value) => value !== localized.command);

    return {
      id: definition.id,
      group: definition.group,
      icon: definition.icon,
      ...localized,
      aliases,
    };
  });
}

export function findSlashCommand(
  token: string,
  locale: Locale,
): SlashCommand | undefined {
  const normalized = token.toLowerCase();

  return getSlashCommands(locale).find((command) =>
    [command.command, ...command.aliases].some(
      (candidate) => candidate.toLowerCase() === normalized,
    ),
  );
}

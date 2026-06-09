import type { LucideIcon } from "lucide-react";

export type CommandId =
  | "summary"
  | "translate"
  | "screenshot"
  | "automation"
  | "model"
  | "context"
  | "language"
  | "new-chat"
  | "reload";

export type CommandGroup = "task" | "settings" | "management";

export type SlashCommand = {
  id: CommandId;
  command: string;
  aliases: string[];
  label: string;
  description: string;
  group: CommandGroup;
  icon: LucideIcon;
};

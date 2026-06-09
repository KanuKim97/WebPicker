export type ConversationEntry = {
  id: string;
  role: "user" | "assistant" | "status";
  title?: string;
  content: string;
  imageUrl?: string;
  pending?: boolean;
};

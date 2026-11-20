export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type ConversationSummary = {
  id: string;
  title: string | null;
  updated_at: string;
};

/** Header con el id de la conversación en la respuesta de /api/chat. */
export const CONVERSATION_HEADER = "X-Conversation-Id";

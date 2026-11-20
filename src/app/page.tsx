import { Suspense } from "react";
import { Chat } from "@/components/chat/chat";
import type { ChatMessage, ConversationSummary } from "@/lib/chat/types";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function ChatScreen({ searchParams }: PageProps<"/">) {
  const { c } = await searchParams;
  const requestedId = typeof c === "string" && UUID_RE.test(c) ? c : null;

  const supabase = await createClient();

  const [conversationsResult, messagesResult] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(30),
    requestedId
      ? supabase
          .from("messages")
          .select("id, role, content")
          .eq("conversation_id", requestedId)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as ChatMessage[] }),
  ]);

  const conversations = (conversationsResult.data ?? []) as ConversationSummary[];
  const messages = (messagesResult.data ?? []) as ChatMessage[];
  // Si el id no existe (o no es tuyo), arranca una conversación nueva.
  const conversationId =
    requestedId && (messages.length > 0 || conversations.some((x) => x.id === requestedId))
      ? requestedId
      : null;

  return (
    <Chat
      key={conversationId ?? "new"}
      conversationId={conversationId}
      initialMessages={conversationId ? messages : []}
      conversations={conversations}
    />
  );
}

export default function Home(props: PageProps<"/">) {
  return (
    <Suspense fallback={<div className="flex h-dvh items-center justify-center text-sm text-muted-foreground">Cargando…</div>}>
      <ChatScreen {...props} />
    </Suspense>
  );
}

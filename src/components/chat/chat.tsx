"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { History, LogOut, Plus, SendHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CONVERSATION_HEADER,
  type ChatMessage,
  type ConversationSummary,
} from "@/lib/chat/types";
import { Markdown } from "./markdown";

type Props = {
  conversationId: string | null;
  initialMessages: ChatMessage[];
  conversations: ConversationSummary[];
};

export function Chat({ conversationId, initialMessages, conversations }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [currentId, setCurrentId] = useState<string | null>(conversationId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const assistantId = crypto.randomUUID();
    setInput("");
    setSending(true);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
      { id: assistantId, role: "assistant", content: "" },
    ]);

    const append = (chunk: string) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
      );

    const isNew = !currentId;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: currentId }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok || !res.body) {
        const data: unknown = await res.json().catch(() => null);
        const msg =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : `Error ${res.status}`;
        append(`_${msg}_`);
        return;
      }

      const newId = res.headers.get(CONVERSATION_HEADER);
      if (newId && newId !== currentId) {
        setCurrentId(newId);
        window.history.replaceState(null, "", `/?c=${newId}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        append(decoder.decode(value, { stream: true }));
      }
      append(decoder.decode());
    } catch {
      append("\n\n_Se cortó la conexión. La respuesta puede haber quedado guardada: recargá._");
    } finally {
      setSending(false);
      // Actualiza la lista de conversaciones cuando se creó una nueva.
      if (isNew) router.refresh();
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-1 border-b px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <h1 className="flex-1 text-base font-semibold">Jarvinho</h1>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Historial"
          aria-pressed={showHistory}
          onClick={() => setShowHistory((v) => !v)}
        >
          <History />
        </Button>
        <Link
          href="/"
          aria-label="Nueva conversación"
          onClick={() => setShowHistory(false)}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <Plus />
        </Link>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="ghost" size="icon" aria-label="Cerrar sesión">
            <LogOut />
          </Button>
        </form>
      </header>

      {showHistory && (
        <nav className="max-h-[50dvh] overflow-y-auto border-b bg-muted/40" aria-label="Conversaciones">
          {conversations.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">Todavía no hay conversaciones.</p>
          ) : (
            <ul>
              {conversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/?c=${c.id}`}
                    onClick={() => setShowHistory(false)}
                    className={cn(
                      "block truncate px-3 py-2 text-sm hover:bg-muted",
                      c.id === currentId && "font-medium",
                    )}
                  >
                    {c.title || "Sin título"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>
      )}

      <main className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.length === 0 && (
            <p className="mt-16 text-center text-sm text-muted-foreground">
              ¿En qué te ayudo hoy?
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-[15px] leading-relaxed",
                m.role === "user"
                  ? "self-end whitespace-pre-wrap bg-primary text-primary-foreground"
                  : "self-start bg-muted",
              )}
            >
              {m.role === "assistant" ? (
                m.content ? (
                  <Markdown>{m.content}</Markdown>
                ) : (
                  <span className="animate-pulse text-muted-foreground">Pensando…</span>
                )
              ) : (
                m.content
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </main>

      <form
        onSubmit={send}
        className="border-t px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Escribí un mensaje…"
            rows={1}
            className="max-h-40 min-h-10 resize-none text-base"
            aria-label="Mensaje"
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim()} aria-label="Enviar">
            <SendHorizontal />
          </Button>
        </div>
      </form>
    </div>
  );
}

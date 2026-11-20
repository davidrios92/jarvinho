import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedEmail } from "@/lib/env";
import { CHAT_MODEL, HISTORY_LIMIT, anthropic, systemPrompt } from "@/lib/chat/agent";
import { CONVERSATION_HEADER } from "@/lib/chat/types";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const MAX_MESSAGE_CHARS = 8000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // El proxy ya filtra, pero el endpoint valida por su cuenta.
  const { data: auth } = await supabase.auth.getClaims();
  const email = typeof auth?.claims?.email === "string" ? auth.claims.email : null;
  if (!auth?.claims || !isAllowedEmail(email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const message =
    body && typeof body === "object" && "message" in body && typeof body.message === "string"
      ? body.message.trim()
      : "";
  const requestedId =
    body && typeof body === "object" && "conversationId" in body &&
    typeof body.conversationId === "string" && UUID_RE.test(body.conversationId)
      ? body.conversationId
      : null;

  if (!message || message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json({ error: "Mensaje vacío o demasiado largo" }, { status: 400 });
  }

  // Conversación existente (RLS garantiza que sea propia) o una nueva.
  let conversationId = requestedId;
  if (conversationId) {
    const { data } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .maybeSingle();
    if (!data) conversationId = null;
  }
  if (!conversationId) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({ title: message.slice(0, 80) })
      .select("id")
      .single();
    if (error || !data) {
      console.error("crear conversación", error?.message);
      return NextResponse.json({ error: "No se pudo crear la conversación" }, { status: 500 });
    }
    conversationId = data.id as string;
  }

  const { error: insertError } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role: "user", content: message, channel: "pwa" });
  if (insertError) {
    console.error("guardar mensaje", insertError.message);
    return NextResponse.json({ error: "No se pudo guardar el mensaje" }, { status: 500 });
  }

  // Últimos N mensajes (incluye el que acabamos de guardar), en orden cronológico.
  const { data: rows, error: historyError } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  if (historyError || !rows) {
    return NextResponse.json({ error: "No se pudo leer el historial" }, { status: 500 });
  }

  const history: Anthropic.Beta.BetaMessageParam[] = rows
    .reverse()
    .map((r) => ({ role: r.role as "user" | "assistant", content: r.content as string }));
  // La API exige que el primer mensaje sea del usuario.
  while (history.length > 0 && history[0].role !== "user") history.shift();

  const today = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "full",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  const savedId = conversationId;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let text = "";
      let clientGone = false;
      const send = (chunk: string) => {
        if (clientGone) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          clientGone = true; // el usuario cerró la app: igual terminamos y guardamos
        }
      };

      try {
        const claude = anthropic().beta.messages.stream({
          model: CHAT_MODEL,
          max_tokens: 16000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "low" },
          cache_control: { type: "ephemeral" },
          system: systemPrompt(today),
          messages: history,
        });

        for await (const event of claude) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            text += event.delta.text;
            send(event.delta.text);
          }
        }

        const final = await claude.finalMessage();
        if (final.stop_reason === "refusal") {
          const note = "\n\n_No puedo ayudarte con eso._";
          text += note;
          send(note);
        } else if (final.stop_reason === "max_tokens") {
          const note = "\n\n_(Respuesta cortada por largo.)_";
          text += note;
          send(note);
        }
      } catch (error) {
        console.error("claude", error);
        const note = (text ? "\n\n" : "") + describeError(error);
        text += note;
        send(note);
      }

      if (text.trim()) {
        const { error } = await supabase.from("messages").insert({
          conversation_id: savedId,
          role: "assistant",
          content: text,
          channel: "pwa",
        });
        if (error) console.error("guardar respuesta", error.message);
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", savedId);
      }

      if (!clientGone) controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      [CONVERSATION_HEADER]: savedId,
    },
  });
}

function describeError(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) {
    return "_Error: la API key de Anthropic no es válida o falta._";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "_Error: límite de uso de la API alcanzado. Probá en un rato._";
  }
  if (error instanceof Anthropic.APIError) {
    return `_Error de la API de Claude (${error.status ?? "sin estado"})._`;
  }
  return "_Error inesperado al generar la respuesta._";
}

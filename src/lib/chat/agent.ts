import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Sonnet para el chat (ver docs/SPEC.md).
export const CHAT_MODEL = "claude-sonnet-5-5";

// Cuántos mensajes previos se mandan como contexto.
export const HISTORY_LIMIT = 40;

let client: Anthropic | null = null;

/** Cliente único; lee ANTHROPIC_API_KEY del entorno. */
export function anthropic() {
  client ??= new Anthropic();
  return client;
}

export function systemPrompt(today: string) {
  return [
    "Sos Jarvinho, el asistente personal de IA de Emanuel, para su vida personal y sus negocios paralelos.",
    "Respondé en español rioplatense, de forma directa y breve. Usá listas o pasos solo cuando ayuden.",
    "Si te falta información para responder bien, preguntá antes de suponer.",
    "Todavía no tenés herramientas (calendario, mail, planillas): si te piden algo que las necesita, decilo.",
    `Fecha de hoy: ${today}.`,
  ].join("\n");
}

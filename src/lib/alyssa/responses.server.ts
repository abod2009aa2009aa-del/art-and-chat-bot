import { createLovableAiGatewayRunIdFetch } from "./gateway-run-id.server";
import { toResponseInput, type ConversationTurn } from "./conversation";

export type ResponseItem = Record<string, any>;

export async function callAstraResponses(input: ResponseItem[], tools: any[], gateway: ReturnType<typeof createLovableAiGatewayRunIdFetch>) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const response = await gateway.fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra", input, tools, tool_choice: "auto",
      stream: true, store: false,
      reasoning: { effort: "medium", summary: "auto" }, include: ["reasoning.encrypted_content"],
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    let message = `AI ${response.status}`;
    try { const parsed = JSON.parse(body); message += `: ${parsed.message ?? parsed.error?.message ?? "Request failed"}`; } catch { /* Do not echo arbitrary upstream content. */ }
    throw new Error(message);
  }
  if (!response.body) throw new Error("AI returned no stream");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output: ResponseItem[] | undefined;
  const consume = (line: string) => {
    if (!line.startsWith("data: ") || line === "data: [DONE]") return;
    const event = JSON.parse(line.slice(6));
    if (event.type === "response.completed") output = event.response.output;
    if (["error", "response.failed", "response.incomplete"].includes(event.type)) {
      throw new Error(event.error?.message ?? event.response?.error?.message ?? "AI request did not complete");
    }
  };
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) consume(line.trimEnd());
    }
    if (buffer) consume(buffer.trimEnd());
  } finally { reader.releaseLock(); }
  if (!output) throw new Error("AI stream ended without a completed result");
  const refusal = output.flatMap((item) => item.content ?? []).find((part) => part.type === "refusal");
  if (refusal) throw new Error(refusal.refusal || "The model declined this request");
  return output;
}

export function createAstraConversation(turns: ConversationTurn[]) {
  return { input: toResponseInput(turns), gateway: createLovableAiGatewayRunIdFetch() };
}
// ALYSSA CYBER — AI Orchestrator.
// Single entry point that runs a chat turn through openai/gpt-6-astra with
// function tools from tools.server.ts. The model chooses which tools to call
// (create project, write/read file, lint, search, package zip, ...). The
// orchestrator loops tool calls, feeds results back, and returns the final
// assistant text plus any files the tools produced for Telegram to deliver.

import { TOOLS, TOOL_SCHEMAS, executeTool, type ToolContext } from "./tools.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const MAX_STEPS = 8;

export type OrchestratorInput = {
  ownerId: number;
  chatId: number;
  messages: Array<{ role: string; content: any; tool_call_id?: string; tool_calls?: any[]; name?: string }>;
};

export type OrchestratorResult = {
  text: string;
  deliveries: Array<{ name: string; buffer: Buffer }>;
  toolCalls: Array<{ name: string; ok: boolean }>;
  usedFallback: boolean;
};

async function callAstra(messages: any[], tools: any[]) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const r = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { "Lovable-API-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools,
      tool_choice: "auto",
      reasoning_effort: "low",
    }),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`astra ${r.status}: ${txt.slice(0, 400)}`);
  return JSON.parse(txt);
}

export async function runOrchestrator(input: OrchestratorInput): Promise<OrchestratorResult> {
  const ctx: ToolContext = {
    ownerId: input.ownerId,
    chatId: input.chatId,
    projectId: null,
    jobId: null,
    deliveries: [],
  };
  const toolCalls: Array<{ name: string; ok: boolean }> = [];
  const convo: any[] = [...input.messages];

  for (let step = 0; step < MAX_STEPS; step++) {
    const data = await callAstra(convo, TOOL_SCHEMAS);
    const choice = data.choices?.[0];
    const msg = choice?.message ?? {};
    const calls = msg.tool_calls as any[] | undefined;

    if (calls && calls.length) {
      // Append the assistant message that requested the tool calls, verbatim.
      convo.push({
        role: "assistant",
        content: msg.content ?? "",
        tool_calls: calls,
      });
      for (const c of calls) {
        const name = c.function?.name;
        let args: any = {};
        try { args = JSON.parse(c.function?.arguments ?? "{}"); } catch { args = {}; }
        const known = TOOLS.some((t) => t.name === name);
        const result = known
          ? await executeTool(name, args, ctx)
          : { ok: false, error: `أداة غير معروفة: ${name}` };
        toolCalls.push({ name: String(name), ok: result.ok !== false });
        convo.push({
          role: "tool",
          tool_call_id: c.id,
          content: JSON.stringify(result).slice(0, 6000),
        });
      }
      continue;
    }

    const text = String(msg.content ?? "").trim();
    return { text, deliveries: ctx.deliveries, toolCalls, usedFallback: false };
  }

  // Hit step cap — return what we have.
  return {
    text: "توقفت بعد عدة خطوات لتفادي حلقة لا تنتهي. جرب طلب أوضح أو قسّمه لخطوات.",
    deliveries: ctx.deliveries,
    toolCalls,
    usedFallback: false,
  };
}

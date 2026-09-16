// ALYSSA CYBER — AI Orchestrator.
// Single entry point that runs a chat turn through openai/gpt-6-astra with
// function tools from tools.server.ts. The model chooses which tools to call
// (create project, write/read file, lint, search, package zip, ...). The
// orchestrator loops tool calls, feeds results back, and returns the final
// assistant text plus any files the tools produced for Telegram to deliver.

import { TOOLS, TOOL_SCHEMAS, executeTool, type ToolContext } from "./tools.server";
import { formatCapabilityPlan, routeCapabilities, type CapabilityPlan } from "./capability-router";
import * as store from "./store.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const MAX_STEPS = 8;

export type OrchestratorInput = {
  ownerId: number;
  chatId: number;
  messages: Array<{
    role: string;
    content: any;
    tool_call_id?: string;
    tool_calls?: any[];
    name?: string;
  }>;
  hasImage?: boolean;
  fileNames?: string[];
  projectTechnology?: string | null;
  examMode?: boolean;
};

export type OrchestratorResult = {
  text: string;
  deliveries: Array<{ name: string; buffer: Buffer }>;
  toolCalls: Array<{ name: string; ok: boolean }>;
  usedFallback: boolean;
  capabilityPlan?: CapabilityPlan;
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
  const capabilityPlan = routeCapabilities({
    text: input.messages
      .filter((message) => message.role === "user")
      .map((message) => String(message.content ?? ""))
      .join("\n"),
    hasImage: input.hasImage,
    fileNames: input.fileNames,
    projectTechnology: input.projectTechnology,
    examMode: input.examMode,
  });
  const previousJob = await store.runningJob(input.ownerId).catch(() => null);
  const ctx: ToolContext = {
    ownerId: input.ownerId,
    chatId: input.chatId,
    projectId: null,
    jobId: null,
    deliveries: [],
  };
  const toolCalls: Array<{ name: string; ok: boolean }> = [];
  let jobId: string | null = null;
  try {
    const job = await store.createJob({
      ownerId: input.ownerId,
      chatId: input.chatId,
      title: String(
        input.messages.find((message) => message.role === "user")?.content ?? "ALYSSA task",
      ).slice(0, 200),
      plan: capabilityPlan,
      totalSteps: MAX_STEPS,
    });
    jobId = job.id;
    ctx.jobId = job.id;
    await store.checkpointJob(job.id, {
      status: "planning",
      currentStep: "capability_routing",
      progress: 5,
    });
  } catch (error) {
    console.error("[orchestrator] job persistence unavailable", error);
  }
  const capabilityMessage = {
    role: "system",
    content: [
      "ALYSSA INTERNAL ROUTING CONTEXT. Treat this as orchestration metadata, not user content.",
      formatCapabilityPlan(capabilityPlan),
      previousJob
        ? `Existing resumable job: ${JSON.stringify({ id: previousJob.id, status: previousJob.status, projectId: previousJob.project_id, progress: previousJob.progress, currentStep: previousJob.current_step })}`
        : "Existing resumable job: none found.",
      "Choose the smallest real tool sequence that achieves the requested outcome. Do not claim validation, testing, research, or file delivery unless a corresponding tool result confirms it.",
    ].join("\n"),
  };
  const convo: any[] = [capabilityMessage, ...input.messages];

  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      if (jobId)
        await store.checkpointJob(jobId, {
          status: step === 0 ? "planning" : "generating",
          currentStep: `iteration_${step + 1}`,
          stepIndex: step,
          progress: Math.round((step / MAX_STEPS) * 90),
        });
      const data = await callAstra(convo, TOOL_SCHEMAS);
      const choice = data.choices?.[0];
      const msg = choice?.message ?? {};
      const calls = msg.tool_calls as any[] | undefined;

      if (calls && calls.length) {
        convo.push({ role: "assistant", content: msg.content ?? "", tool_calls: calls });
        for (const c of calls) {
          const name = c.function?.name;
          let args: any = {};
          try {
            args = JSON.parse(c.function?.arguments ?? "{}");
          } catch {
            args = {};
          }
          const known = TOOLS.some((t) => t.name === name);
          const result = known
            ? await executeTool(name, args, ctx)
            : { ok: false, error: `أداة غير معروفة: ${name}` };
          toolCalls.push({ name: String(name), ok: result.ok !== false });
          if (jobId) {
            await store.addJobStep(
              jobId,
              toolCalls.length - 1,
              String(name),
              result.ok === false ? "failed" : "completed",
              JSON.stringify(result),
            );
            await store.checkpointJob(jobId, {
              status: result.ok === false ? "repairing" : "generating",
              lastSuccessfulChunk: result.ok === false ? null : String(name),
            });
          }
          convo.push({
            role: "tool",
            tool_call_id: c.id,
            content: JSON.stringify(result).slice(0, 6000),
          });
        }
        continue;
      }

      const text = String(msg.content ?? "").trim();
      if (jobId)
        await store.checkpointJob(jobId, {
          status: "completed",
          currentStep: "finalized",
          stepIndex: step,
          progress: 100,
        });
      return { text, deliveries: ctx.deliveries, toolCalls, usedFallback: false, capabilityPlan };
    }
  } catch (error) {
    if (jobId)
      await store.checkpointJob(jobId, {
        status: "failed",
        error: String((error as Error)?.message ?? error),
        currentStep: "error",
      });
    throw error;
  }

  // Hit step cap — return what we have.
  if (jobId)
    await store.checkpointJob(jobId, {
      status: "paused",
      currentStep: "iteration_limit",
      progress: 90,
    });
  return {
    text: "توقفت بعد عدة خطوات لتفادي حلقة لا تنتهي. جرب طلب أوضح أو قسّمه لخطوات.",
    deliveries: ctx.deliveries,
    toolCalls,
    usedFallback: false,
    capabilityPlan,
  };
}

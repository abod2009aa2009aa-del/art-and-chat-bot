import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function db() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export default defineTool({
  name: "alyssa_job_status",
  title: "Read ALYSSA job status",
  description: "Read-only status and recent steps for an owner-owned ALYSSA job.",
  inputSchema: {
    owner_id: z.number().int().describe("Telegram owner id"),
    job_id: z.string().uuid().optional().describe("Optional job id"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ owner_id, job_id }) => {
    const supabase = db();
    let query = supabase
      .from("alyssa_jobs")
      .select("id,title,status,current_step,progress,step_index,total_steps,error,updated_at")
      .eq("owner_id", owner_id)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (job_id) query = query.eq("id", job_id);
    const { data: jobs, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const job = jobs?.[0] ?? null;
    if (!job) return { content: [{ type: "text", text: "لا توجد مهمة" }], structuredContent: { job: null } };
    const { data: steps } = await supabase
      .from("alyssa_job_steps")
      .select("idx,name,status,output,created_at")
      .eq("job_id", job.id)
      .order("idx", { ascending: true })
      .limit(100);
    const result = { ...job, steps: steps ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: { job: result },
    };
  },
});

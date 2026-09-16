import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function db() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "search_messages",
  title: "Search Telegram messages",
  description:
    "Full-text search across stored Telegram conversation messages (user + assistant). Returns matching rows ordered by newest first.",
  inputSchema: {
    query: z.string().min(1).describe("Substring to search for in message content."),
    chat_id: z.number().optional().describe("Optional Telegram chat_id to scope the search."),
    limit: z.number().int().min(1).max(100).optional().describe("Max rows (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, chat_id, limit }) => {
    const supabase = db();
    let q = supabase
      .from("telegram_messages")
      .select("id, chat_id, chat_type, role, user_name, content, created_at")
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (typeof chat_id === "number") q = q.eq("chat_id", chat_id);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { rows: data ?? [] },
    };
  },
});

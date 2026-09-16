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
  name: "recent_messages",
  title: "Recent Telegram messages",
  description: "Fetch the most recent messages in a Telegram chat, newest first.",
  inputSchema: {
    chat_id: z.number().describe("Telegram chat_id to fetch messages from."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ chat_id, limit }) => {
    const supabase = db();
    const { data, error } = await supabase
      .from("telegram_messages")
      .select("id, chat_id, chat_type, role, user_name, content, created_at")
      .eq("chat_id", chat_id)
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { rows: data ?? [] },
    };
  },
});

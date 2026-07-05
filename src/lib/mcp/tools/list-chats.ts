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
  name: "list_chats",
  title: "List Telegram chats",
  description:
    "List distinct Telegram chats that have stored messages, with message counts and latest activity timestamp.",
  inputSchema: {
    limit: z.number().int().min(1).max(500).optional().describe("Max recent messages to scan (default 500)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }) => {
    const supabase = db();
    const { data, error } = await supabase
      .from("telegram_messages")
      .select("chat_id, chat_type, user_name, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 500);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const map = new Map<number, { chat_id: number; chat_type: string; count: number; last_activity: string; sample_user: string | null }>();
    for (const row of data ?? []) {
      const cur = map.get(row.chat_id);
      if (cur) {
        cur.count++;
      } else {
        map.set(row.chat_id, {
          chat_id: row.chat_id,
          chat_type: row.chat_type,
          count: 1,
          last_activity: row.created_at,
          sample_user: row.user_name,
        });
      }
    }
    const chats = [...map.values()].sort((a, b) => b.last_activity.localeCompare(a.last_activity));
    return {
      content: [{ type: "text", text: JSON.stringify(chats, null, 2) }],
      structuredContent: { chats },
    };
  },
});

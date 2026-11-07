import { REQUESTS_PER_MINUTE } from "./telegram-features";
export type Control = { id: string; chat_id: number; owner_id: number; message_id: number | null; kind: string; content: string; file_id: string | null; busy: boolean; created_at: string };
async function client() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}
export async function claimUpdate(updateId: number): Promise<boolean> {
  const c = await client();
  const { error } = await c.from("alisa_update_receipts").insert({ update_id: updateId });
  if (error?.code === "23505") return false;
  if (error) throw new Error("Update receipt storage unavailable");
  return true;
}
export async function takeRequest(userId: number): Promise<boolean> {
  const { data, error } = await (await client()).rpc("alisa_take_request", { p_user_id: userId, p_limit: REQUESTS_PER_MINUTE });
  if (error) throw new Error("Request protection unavailable");
  return data === true;
}
export async function resetAt(chatId: number): Promise<string | null> {
  const { data, error } = await (await client()).from("alisa_conversations").select("reset_at").eq("chat_id", chatId).maybeSingle();
  if (error) throw new Error("Conversation state unavailable");
  return data?.reset_at ?? null;
}
export async function resetConversation(chatId: number, clear: boolean) {
  const c = await client();
  const { error } = await c.from("alisa_conversations").upsert({ chat_id: chatId, reset_at: new Date().toISOString() });
  if (error) throw new Error("Conversation reset failed");
  if (clear) {
    const { error: deletion } = await c.from("telegram_messages").delete().eq("chat_id", chatId);
    if (deletion) throw new Error("Conversation deletion failed");
  }
  const { error: controls } = await c.from("alisa_controls").delete().eq("chat_id", chatId);
  if (controls) throw new Error("Conversation controls reset failed");
  const { error: summary } = await c.from("alyssa_memory_summaries").delete().eq("chat_id", chatId);
  if (summary) throw new Error("Conversation summary reset failed");
}
export async function createControl(chatId: number, ownerId: number, kind: string, content: string, fileId?: string): Promise<Control> {
  const { data, error } = await (await client()).from("alisa_controls").insert({ chat_id: chatId, owner_id: ownerId, kind, content, file_id: fileId ?? null }).select().single();
  if (error || !data) throw new Error("Control storage unavailable");
  return data;
}
export async function getControl(id: string): Promise<Control | null> {
  const { data, error } = await (await client()).from("alisa_controls").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Control storage unavailable");
  return data;
}
export async function lockControl(id: string, ownerId: number, chatId: number): Promise<boolean> {
  const { data, error } = await (await client()).from("alisa_controls").update({ busy: true }).eq("id", id).eq("owner_id", ownerId).eq("chat_id", chatId).eq("busy", false).select("id").maybeSingle();
  if (error) throw new Error("Control lock unavailable");
  return Boolean(data);
}
export async function updateControl(id: string, patch: { busy?: boolean; content?: string; message_id?: number }) {
  const { error } = await (await client()).from("alisa_controls").update(patch).eq("id", id);
  if (error) throw new Error("Control update failed");
}
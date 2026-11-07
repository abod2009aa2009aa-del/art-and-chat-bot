import { createParser } from "eventsource-parser";
export async function transcribeVoice(bytes: Uint8Array, mime: string, request: typeof fetch = fetch): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Voice provider not configured");
  if (!bytes.length || bytes.length > 20_000_000) throw new Error("Unsupported audio size");
  if (!mime.startsWith("audio/")) throw new Error("Unsupported audio format");
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type: mime }), mime.includes("ogg") ? "voice.ogg" : "voice.audio");
  form.append("model", "openai/gpt-transcribe");
  form.append("stream", "true");
  form.append("response_format", "json");
  const response = await request("https://ai.gateway.lovable.dev/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Voice provider ${response.status}`);
  }
  if (!response.body) throw new Error("Voice provider returned no stream");
  let final: string | undefined;
  let failure: Error | undefined;
  const parser = createParser({ onEvent(event) {
    try {
      if (event.data === "[DONE]") return;
      const data = JSON.parse(event.data);
      if (data.type === "error" || event.event === "error") failure = new Error("Voice provider processing failed");
      if (data.type === "transcript.text.done" || event.event === "transcript.text.done") final = data.text;
    } catch { failure = new Error("Invalid voice response"); }
  } });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      parser.feed(decoder.decode(chunk.value, { stream: true }));
    }
    parser.feed(decoder.decode());
  } finally { reader.releaseLock(); }
  if (failure) throw failure;
  if (!final?.trim()) throw new Error("Voice provider returned no completed transcript");
  return final.trim();
}
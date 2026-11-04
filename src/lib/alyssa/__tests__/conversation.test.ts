import { describe, expect, it } from "vitest";
import { attachmentMemory, contentText, splitTelegramText, toResponseInput } from "../conversation";

describe("unified conversation", () => {
  it("keeps image and previous speech in the same ordered context", () => {
    const input = toResponseInput([{ role: "user", content: "قارن بالصورة السابقة" }, { role: "assistant", content: "قميص أحمر" }, { role: "user", content: [{ type: "image_url", image_url: { url: "data:image/png;base64,abc" } }] }]);
    expect(input[0].content).toEqual([{ type: "input_text", text: "قارن بالصورة السابقة" }]);
    expect(input[1].content).toEqual([{ type: "output_text", text: "قميص أحمر" }]);
    expect(input[2].content).toEqual([{ type: "input_image", image_url: "data:image/png;base64,abc" }]);
  });
  it("retains file contents and caption for later text recall", () => {
    expect(attachmentMemory("ملف", "file-1", "شنو السعر؟", "invoice.txt", "السعر 25000")).toContain("السعر 25000");
  });
  it("uses typed PDF input instead of unreliable loose-text-only analysis", () => {
    expect(toResponseInput([{ role: "user", content: [{ type: "file", file: { filename: "scan.pdf", file_data: "data:application/pdf;base64,abc" } }] }])[0].content).toEqual([{ type: "input_file", filename: "scan.pdf", file_data: "data:application/pdf;base64,abc" }]);
  });
  it("extracts intent text from media instead of object stringification", () => {
    expect(contentText([{ type: "text", text: "حلل الفاتورة" }, { type: "image_url" }])).toBe("حلل الفاتورة");
  });
  it("sends the complete analysis without truncation", () => {
    const text = "ا".repeat(12000);
    expect(splitTelegramText(text).join("")).toBe(text);
    expect(splitTelegramText(text).every((part) => part.length <= 3900)).toBe(true);
  });
});
import mammoth from "mammoth";
import { extractText } from "unpdf";

export async function extractDocumentText(
  name: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ fullText: string; pages?: { page: number; text: string }[] }> {
  const lower = name.toLowerCase();

  // 1. Text, Markdown, CSV
  if (
    mimeType.includes("text") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".csv")
  ) {
    return { fullText: buffer.toString("utf-8") };
  }

  // 2. PDF via unpdf
  if (mimeType.includes("pdf") || lower.endsWith(".pdf")) {
    try {
      const result = await extractText(new Uint8Array(buffer));
      // unpdf returns text or array of text pages
      if (Array.isArray(result.text)) {
        const pages = result.text.map((text, idx) => ({ page: idx + 1, text }));
        return {
          fullText: result.text.join("\n\n"),
          pages,
        };
      }
      return { fullText: String(result.text || "") };
    } catch (err: any) {
      throw new Error(`PDF text extraction failed: ${err.message}`);
    }
  }

  // 3. DOCX via mammoth
  if (
    mimeType.includes("wordprocessingml") ||
    lower.endsWith(".docx") ||
    lower.endsWith(".doc")
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return { fullText: result.value };
    } catch (err: any) {
      throw new Error(`DOCX text extraction failed: ${err.message}`);
    }
  }

  // Default UTF-8 fallback
  return { fullText: buffer.toString("utf-8") };
}

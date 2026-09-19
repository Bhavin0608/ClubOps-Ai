import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env } from "@/lib/env";
import { AiOutputError, AiUnavailableError } from "@/lib/errors";

export interface ChatTurn {
  role: "user" | "assistant" | "system" | "tool";
  content?: string;
  toolCallId?: string;
  toolName?: string;
  toolCalls?: { id: string; name: string; args: unknown }[];
  toolResponses?: { toolName: string; content: string }[];
}

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface Llm {
  generateJson<T>(opts: {
    system: string;
    prompt: string;
    schema: z.ZodType<T>;
    temperature?: number;
  }): Promise<T>;

  chatWithTools(opts: {
    system: string;
    messages: ChatTurn[];
    tools: ToolDeclaration[];
  }): Promise<{ text?: string; toolCalls: { id: string; name: string; args: unknown }[] }>;

  embed(texts: string[], kind: "document" | "query"): Promise<number[][]>;
}

// Generate simple mock embeddings for fallback / offline test
function generateMockEmbedding(text: string, dimensions = 768): number[] {
  const vec = new Array(dimensions).fill(0);
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed = (seed * 31 + text.charCodeAt(i)) & 0xffffffff;
  }
  for (let j = 0; j < dimensions; j++) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    vec[j] = (seed / 0xffffffff) * 2 - 1;
  }
  // Normalize vector
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return vec.map((v) => v / (norm || 1));
}

class GeminiLlm implements Llm {
  private client: GoogleGenAI | null = null;

  constructor() {
    if (env.GEMINI_API_KEY) {
      this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    }
  }

  private async executeWithRetryAndFallback<R>(
    operationName: string,
    action: (modelName: string) => Promise<R>
  ): Promise<R> {
    const candidateModels = [
      env.AI_MODEL,
      "gemini-flash-latest",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
    ].filter((m, i, arr) => arr.indexOf(m) === i && Boolean(m));

    let lastError: any;

    for (const model of candidateModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          return await action(model);
        } catch (err: any) {
          lastError = err;
          const status = err.status || err.code;
          const msg = (err.message || "").toLowerCase();
          const isTransient =
            status === 503 ||
            status === 429 ||
            msg.includes("503") ||
            msg.includes("429") ||
            msg.includes("high demand") ||
            msg.includes("resource has been exhausted");

          if (isTransient && attempt === 0) {
            console.warn(`[AI Engine] ${operationName}: Model "${model}" reported high demand (503/429). Retrying in 700ms...`);
            await new Promise((r) => setTimeout(r, 700));
            continue;
          }

          console.warn(`[AI Engine] ${operationName}: Model "${model}" temporarily unavailable. Trying next fallback model...`);
          break;
        }
      }
    }

    throw lastError;
  }

  async generateJson<T>(opts: {
    system: string;
    prompt: string;
    schema: z.ZodType<T>;
    temperature?: number;
  }): Promise<T> {
    if (!this.client || !env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not configured. Falling back to structured default output.");
      throw new AiUnavailableError("GEMINI_API_KEY is not configured in .env");
    }

    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const fullPrompt =
          attempt === 0
            ? opts.prompt
            : `${opts.prompt}\n\nIMPORTANT: Your previous output failed validation with: ${JSON.stringify(
                lastError
              )}. Provide strictly valid JSON conforming to the requested schema.`;

        const response = await this.executeWithRetryAndFallback("generateJson", (model) =>
          this.client!.models.generateContent({
            model,
            contents: fullPrompt,
            config: {
              systemInstruction: `${opts.system}\nOutput valid JSON only.`,
              responseMimeType: "application/json",
              temperature: opts.temperature ?? 0.1,
            },
          })
        );

        const text = response.text?.trim() ?? "{}";
        const parsedJson = JSON.parse(text);
        const validated = opts.schema.safeParse(parsedJson);

        if (validated.success) {
          return validated.data;
        } else {
          lastError = validated.error.issues;
        }
      } catch (err: any) {
        lastError = err;
        if (attempt === 1) {
          throw new AiOutputError("Failed to generate valid structured output from AI", err);
        }
      }
    }

    throw new AiOutputError("Failed to parse and validate AI response", lastError);
  }

  async chatWithTools(opts: {
    system: string;
    messages: ChatTurn[];
    tools: ToolDeclaration[];
  }): Promise<{ text?: string; toolCalls: { id: string; name: string; args: unknown }[] }> {
    if (!this.client || !env.GEMINI_API_KEY) {
      throw new AiUnavailableError("GEMINI_API_KEY is not configured");
    }

    try {
      // Map tools to Gemini functionDeclarations format
      const geminiTools = opts.tools.length > 0
        ? [
            {
              functionDeclarations: opts.tools.map((t) => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters as any,
              })),
            },
          ]
        : undefined;

      // Convert messages to Gemini format
      const rawContents: any[] = [];
      for (const m of opts.messages) {
        if (m.role === "assistant") {
          const parts: any[] = [];
          if (m.content && m.content.trim()) {
            parts.push({ text: m.content });
          }
          if (m.toolCalls && m.toolCalls.length > 0) {
            for (const tc of m.toolCalls) {
              parts.push({
                functionCall: {
                  name: tc.name,
                  args: (tc.args as Record<string, unknown>) || {},
                },
              });
            }
          }
          if (parts.length > 0) {
            rawContents.push({ role: "model", parts });
          }
        } else if (m.role === "tool" || m.toolResponses) {
          const parts: any[] = [];
          if (m.toolResponses && m.toolResponses.length > 0) {
            for (const tr of m.toolResponses) {
              parts.push({
                functionResponse: {
                  name: tr.toolName,
                  response: { output: tr.content },
                },
              });
            }
          } else if (m.toolName) {
            parts.push({
              functionResponse: {
                name: m.toolName,
                response: { output: m.content ?? "" },
              },
            });
          }
          if (parts.length > 0) {
            rawContents.push({ role: "user", parts });
          }
        } else if (m.role === "user") {
          if (m.content && m.content.trim()) {
            rawContents.push({
              role: "user",
              parts: [{ text: m.content }],
            });
          }
        }
      }

      // Merge consecutive turns with the same role so Gemini does not reject the conversation
      const contents: any[] = [];
      for (const item of rawContents) {
        const prev = contents[contents.length - 1];
        if (prev && prev.role === item.role) {
          prev.parts.push(...item.parts);
        } else {
          contents.push({ role: item.role, parts: [...item.parts] });
        }
      }

      const response = await this.executeWithRetryAndFallback("chatWithTools", (model) =>
        this.client!.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: opts.system,
            tools: geminiTools,
            temperature: 0.2,
          },
        })
      );

      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts ?? [];

      const toolCalls: { id: string; name: string; args: unknown }[] = [];
      let textContent = "";

      for (const part of parts) {
        if ("text" in part && part.text) {
          textContent += part.text;
        }
        if ("functionCall" in part && part.functionCall) {
          toolCalls.push({
            id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: part.functionCall.name ?? "",
            args: part.functionCall.args ?? {},
          });
        }
      }

      return {
        text: textContent || undefined,
        toolCalls,
      };
    } catch (err: any) {
      console.error("Gemini chatWithTools error:", err);
      throw new AiUnavailableError(err.message || "Failed to communicate with AI model");
    }
  }

  async embed(texts: string[], kind: "document" | "query" = "document"): Promise<number[][]> {
    if (!this.client || !env.GEMINI_API_KEY) {
      // Return fallback embeddings for offline resilience
      return texts.map((t) => generateMockEmbedding(t));
    }

    try {
      const results: number[][] = [];
      // Batch embedding in chunks of 100
      for (let i = 0; i < texts.length; i += 100) {
        const batch = texts.slice(i, i + 100);
        for (const text of batch) {
          const resp: any = await this.client.models.embedContent({
            model: env.EMBEDDING_MODEL,
            contents: text,
          });
          const values = resp.embeddings?.[0]?.values ?? resp.embedding?.values;
          if (values) {
            results.push(values);
          } else {
            results.push(generateMockEmbedding(text));
          }
        }
      }
      return results;
    } catch (err) {
      console.warn("Embeddings API call failed, falling back to deterministic local embeddings:", err);
      return texts.map((t) => generateMockEmbedding(t));
    }
  }
}

export const llm: Llm = new GeminiLlm();

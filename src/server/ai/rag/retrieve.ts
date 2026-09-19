import { prisma } from "@/lib/db";
import { Ctx } from "@/lib/api";
import { env } from "@/lib/env";
import { llm } from "../llm";

export interface RetrievedSource {
  n: number;
  sourceType: "DOCUMENT" | "MEETING";
  sourceName: string;
  locator?: string;
  text: string;
  score: number;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Fallback keyword score if embeddings cannot be computed
function keywordSimilarity(query: string, text: string): number {
  const qWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (qWords.length === 0) return 0;
  const tLower = text.toLowerCase();
  let matches = 0;
  for (const word of qWords) {
    if (tLower.includes(word)) matches++;
  }
  return matches / qWords.length;
}

export async function retrieve(
  ctx: Ctx,
  query: string,
  topK: number = env.RAG_TOP_K
): Promise<RetrievedSource[]> {
  const chunks = await prisma.knowledgeChunk.findMany({
    where: {
      eventId: ctx.eventId,
      embeddingModel: env.EMBEDDING_MODEL,
    },
    include: {
      document: { select: { name: true } },
      meeting: { select: { title: true } },
    },
  });

  if (chunks.length === 0) {
    return [];
  }

  let queryVector: number[] | null = null;
  try {
    const [vec] = await llm.embed([query], "query");
    queryVector = vec;
  } catch (err) {
    console.warn("Query embedding failed, falling back to keyword scoring:", err);
  }

  const scored = chunks.map((chunk) => {
    let score = 0;
    if (queryVector && chunk.embedding && chunk.embedding.length > 0) {
      score = cosineSimilarity(queryVector, chunk.embedding);
    } else {
      score = keywordSimilarity(query, chunk.content);
    }

    const sourceName =
      chunk.sourceType === "DOCUMENT"
        ? chunk.document?.name ?? "Document"
        : chunk.meeting?.title ?? "Meeting Transcript";

    return {
      sourceType: chunk.sourceType,
      sourceName,
      locator: chunk.locator ?? undefined,
      text: chunk.content,
      score,
    };
  });

  const filtered = scored
    .filter((s) => s.score >= env.RAG_MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return filtered.map((item, idx) => ({
    n: idx + 1,
    ...item,
  }));
}

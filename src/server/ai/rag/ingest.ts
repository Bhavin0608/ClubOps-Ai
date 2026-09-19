import { prisma } from "@/lib/db";
import { Ctx } from "@/lib/api";
import { env } from "@/lib/env";
import { llm } from "../llm";
import { extractDocumentText } from "./extract";
import { chunkText } from "./chunk";
import { documentService } from "@/server/services/document.service";
import { storage } from "@/server/storage";

export async function ingestDocument(ctx: Ctx, documentId: string): Promise<void> {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) return;

    const buffer = await storage.getDocumentBytes(documentId);
    const { fullText } = await extractDocumentText(doc.name, doc.mimeType, buffer);

    if (!fullText || fullText.trim().length === 0) {
      await documentService.markFailed(ctx, documentId, "No readable text extracted from document");
      return;
    }

    const chunks = chunkText(fullText, 900, 150, 80, "p.");
    if (chunks.length === 0) {
      await documentService.markFailed(ctx, documentId, "Document too short to generate chunks");
      return;
    }

    const texts = chunks.map((c) => c.content);
    const embeddings = await llm.embed(texts, "document");

    // Clean old chunks if re-ingesting
    await prisma.knowledgeChunk.deleteMany({
      where: { documentId },
    });

    for (let i = 0; i < chunks.length; i++) {
      await prisma.knowledgeChunk.create({
        data: {
          eventId: ctx.eventId,
          sourceType: "DOCUMENT",
          documentId,
          chunkIndex: chunks[i].chunkIndex,
          content: chunks[i].content,
          locator: chunks[i].locator,
          embedding: embeddings[i] || [],
          embeddingModel: env.EMBEDDING_MODEL,
        },
      });
    }

    await documentService.markReady(ctx, documentId);
  } catch (err: any) {
    console.error(`Document ingestion failed for ${documentId}:`, err);
    await documentService.markFailed(ctx, documentId, err.message || "Ingestion processing error");
  }
}

export async function ingestMeetingText(
  ctx: Ctx,
  meetingId: string,
  summary: string,
  decisions: string[],
  transcript?: string
): Promise<void> {
  try {
    const textsToIndex: string[] = [];
    if (summary) textsToIndex.push(`Meeting Summary:\n${summary}`);
    if (decisions && decisions.length > 0) {
      textsToIndex.push(`Decisions Made:\n${decisions.map((d, i) => `${i + 1}. ${d}`).join("\n")}`);
    }
    if (transcript) textsToIndex.push(`Meeting Transcript:\n${transcript}`);

    const combined = textsToIndex.join("\n\n");
    const chunks = chunkText(combined, 900, 150, 80, "notes");
    if (chunks.length === 0) return;

    const texts = chunks.map((c) => c.content);
    const embeddings = await llm.embed(texts, "document");

    await prisma.knowledgeChunk.deleteMany({
      where: { meetingId },
    });

    for (let i = 0; i < chunks.length; i++) {
      await prisma.knowledgeChunk.create({
        data: {
          eventId: ctx.eventId,
          sourceType: "MEETING",
          meetingId,
          chunkIndex: chunks[i].chunkIndex,
          content: chunks[i].content,
          locator: chunks[i].locator,
          embedding: embeddings[i] || [],
          embeddingModel: env.EMBEDDING_MODEL,
        },
      });
    }
  } catch (err) {
    console.error(`Meeting indexing failed for ${meetingId}:`, err);
  }
}

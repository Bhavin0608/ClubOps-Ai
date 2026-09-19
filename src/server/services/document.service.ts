import { prisma } from "@/lib/db";
import { Ctx, requireOrganizer } from "@/lib/api";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { auditService } from "./audit.service";
import { env } from "@/lib/env";
import { DocStatus } from "@prisma/client";

export const documentService = {
  async list(ctx: Ctx) {
    requireOrganizer(ctx);
    // Rule 12: ALWAYS exclude Document.data from list queries
    return prisma.document.findMany({
      where: { eventId: ctx.eventId },
      select: {
        id: true,
        name: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        _count: {
          select: { chunks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async get(ctx: Ctx, documentId: string) {
    requireOrganizer(ctx);
    const doc = await prisma.document.findFirst({
      where: { id: documentId, eventId: ctx.eventId },
      select: {
        id: true,
        name: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        _count: {
          select: { chunks: true },
        },
      },
    });
    if (!doc) throw new NotFoundError("Document not found");
    return doc;
  },

  async upload(
    ctx: Ctx,
    params: {
      name: string;
      mimeType: string;
      sizeBytes: number;
      buffer: Buffer;
    }
  ) {
    requireOrganizer(ctx);

    const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
    if (params.sizeBytes > maxBytes) {
      throw new ValidationError(`File exceeds maximum size of ${env.MAX_UPLOAD_MB} MB`);
    }

    // Basic file signature check for PDF / DOCX
    const magic = params.buffer.subarray(0, 4);
    if (params.name.endsWith(".pdf") && !magic.toString("utf8").startsWith("%PDF")) {
      throw new ValidationError("Invalid PDF file signature");
    }
    if (params.name.endsWith(".docx") && (magic[0] !== 0x50 || magic[1] !== 0x4b)) {
      throw new ValidationError("Invalid DOCX file signature");
    }

    const doc = await prisma.document.create({
      data: {
        eventId: ctx.eventId,
        name: params.name.replace(/[^\w.-]/g, "_"), // sanitize filename
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes,
        data: params.buffer,
        status: "PROCESSING",
        uploadedById: ctx.userId,
      },
      select: {
        id: true,
        name: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        createdAt: true,
      },
    });

    await auditService.record(ctx, {
      action: "document.uploaded",
      entityType: "DOCUMENT",
      entityId: doc.id,
      after: { name: doc.name, sizeBytes: doc.sizeBytes },
    });

    return doc;
  },

  async markReady(ctx: Ctx, documentId: string) {
    return prisma.document.update({
      where: { id: documentId },
      data: { status: "READY" as DocStatus },
    });
  },

  async markFailed(ctx: Ctx, documentId: string, errorMessage: string) {
    return prisma.document.update({
      where: { id: documentId },
      data: {
        status: "FAILED" as DocStatus,
        errorMessage,
      },
    });
  },

  async delete(ctx: Ctx, documentId: string) {
    requireOrganizer(ctx);
    const before = await this.get(ctx, documentId);

    await prisma.document.delete({
      where: { id: documentId },
    });

    await auditService.record(ctx, {
      action: "document.deleted",
      entityType: "DOCUMENT",
      entityId: documentId,
      before,
    });

    return { success: true };
  },
};

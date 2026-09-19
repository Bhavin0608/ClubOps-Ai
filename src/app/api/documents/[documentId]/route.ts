import { NextRequest } from "next/server";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { documentService } from "@/server/services/document.service";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ documentId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();

    const existing = await prisma.document.findUnique({
      where: { id: params.documentId },
      select: { eventId: true },
    });
    if (!existing) throw new NotFoundError("Document not found");

    const ctx = await resolveCtx(user.userId, existing.eventId);
    const doc = await documentService.get(ctx, params.documentId);
    return jsonResponse(doc);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ documentId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();

    const existing = await prisma.document.findUnique({
      where: { id: params.documentId },
      select: { eventId: true },
    });
    if (!existing) throw new NotFoundError("Document not found");

    const ctx = await resolveCtx(user.userId, existing.eventId);
    const result = await documentService.delete(ctx, params.documentId);
    return jsonResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}

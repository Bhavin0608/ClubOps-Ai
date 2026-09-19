import { NextRequest } from "next/server";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError, requireOrganizer } from "@/lib/api";
import { documentService } from "@/server/services/document.service";
import { ingestDocument } from "@/server/ai/rag/ingest";
import { ValidationError } from "@/lib/errors";

export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ eventId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();
    const ctx = await resolveCtx(user.userId, params.eventId);
    const docs = await documentService.list(ctx);
    return jsonResponse(docs);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ eventId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();
    const ctx = await resolveCtx(user.userId, params.eventId);
    requireOrganizer(ctx);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new ValidationError("No file uploaded");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const doc = await documentService.upload(ctx, {
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: buffer.length,
      buffer,
    });

    // Ingest asynchronously / inline
    ingestDocument(ctx, doc.id).catch((err) => {
      console.error(`Background ingest error for doc ${doc.id}:`, err);
    });

    return jsonResponse(doc, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

export const storage = {
  async saveDocumentBytes(documentId: string, bytes: Buffer): Promise<void> {
    await prisma.document.update({
      where: { id: documentId },
      data: { data: bytes },
    });
  },

  async getDocumentBytes(documentId: string): Promise<Buffer> {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { data: true },
    });
    if (!doc || !doc.data) throw new NotFoundError("Document data not found");
    return Buffer.from(doc.data);
  },
};

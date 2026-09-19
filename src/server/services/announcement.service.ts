import { prisma } from "@/lib/db";
import { Ctx, requireOrganizer } from "@/lib/api";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { auditService } from "./audit.service";
import { Audience } from "@prisma/client";

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  audience?: Audience;
  aiGenerated?: boolean;
}

export const announcementService = {
  async list(ctx: Ctx) {
    // Volunteers see only PUBLISHED announcements
    const where: Record<string, unknown> = {
      eventId: ctx.eventId,
    };
    if (ctx.role === "VOLUNTEER") {
      where.status = "PUBLISHED";
    }

    return prisma.announcement.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
  },

  async get(ctx: Ctx, id: string) {
    const item = await prisma.announcement.findFirst({
      where: { id, eventId: ctx.eventId },
    });
    if (!item) throw new NotFoundError("Announcement not found");
    if (ctx.role === "VOLUNTEER" && item.status !== "PUBLISHED") {
      throw new NotFoundError("Announcement not found");
    }
    return item;
  },

  async createDraft(ctx: Ctx, input: CreateAnnouncementInput) {
    requireOrganizer(ctx);

    const item = await prisma.announcement.create({
      data: {
        eventId: ctx.eventId,
        title: input.title,
        content: input.content,
        audience: input.audience ?? "VOLUNTEERS",
        status: "DRAFT",
        aiGenerated: input.aiGenerated ?? (ctx.via === "AI"),
        createdById: ctx.userId,
      },
    });

    await auditService.record(ctx, {
      action: "announcement.draft_created",
      entityType: "ANNOUNCEMENT",
      entityId: item.id,
      after: { title: item.title, audience: item.audience },
    });

    return item;
  },

  async update(ctx: Ctx, id: string, input: Partial<CreateAnnouncementInput>) {
    requireOrganizer(ctx);
    const before = await this.get(ctx, id);

    const updated = await prisma.announcement.update({
      where: { id },
      data: input,
    });

    await auditService.record(ctx, {
      action: "announcement.updated",
      entityType: "ANNOUNCEMENT",
      entityId: id,
      before,
      after: updated,
    });

    return updated;
  },

  async publish(ctx: Ctx, id: string) {
    requireOrganizer(ctx);
    if (ctx.via === "AI") {
      // BR-8: AI can create drafts only. Publishing is a human button.
      throw new ForbiddenError("Only organizers can publish announcements via the UI");
    }

    const before = await this.get(ctx, id);
    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    await auditService.record(ctx, {
      action: "announcement.published",
      entityType: "ANNOUNCEMENT",
      entityId: id,
      before,
      after: updated,
    });

    return updated;
  },
};

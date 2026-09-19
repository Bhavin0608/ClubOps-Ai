import { Ctx, requireOrganizer } from "@/lib/api";
import { prisma } from "@/lib/db";
import { llm } from "../llm";
import { AnnouncementDraftSchema, AnnouncementDraftData } from "../schemas";
import { announcementService } from "@/server/services/announcement.service";
import { Audience } from "@prisma/client";
import { NotFoundError } from "@/lib/errors";

export interface DraftAnnouncementInput {
  purpose: string;
  audience?: Audience;
  tone?: "urgent" | "enthusiastic" | "informative" | "reminder";
}

export const announcementWorkflow = {
  async draft(ctx: Ctx, input: DraftAnnouncementInput) {
    requireOrganizer(ctx);

    const event = await prisma.event.findUnique({
      where: { id: ctx.eventId },
    });
    if (!event) throw new NotFoundError("Event not found");

    const system = `You are a communications manager for college events.
Draft an announcement based ONLY on the facts provided.
Strict rules:
1. Do NOT invent venues, timings, links, or contact details not provided in the input.
2. If any important operational detail is missing, write [TBD] so the organizer can fill it in.
3. Tailor tone to the requested audience.`;

    const prompt = `Event: "${event.name}"
Start Date: ${event.startDate.toISOString().split("T")[0]}
Venue: ${event.venue ?? "[TBD Venue]"}
Target Audience: ${input.audience ?? "VOLUNTEERS"}
Tone: ${input.tone ?? "informative"}
Purpose: "${input.purpose}"`;

    let draft: AnnouncementDraftData;
    try {
      draft = await llm.generateJson({
        system,
        prompt,
        schema: AnnouncementDraftSchema,
        temperature: 0.4,
      });
    } catch {
      draft = {
        title: `Update: ${input.purpose}`,
        content: `Hi team! Regarding ${event.name} on ${event.startDate.toISOString().split("T")[0]} at ${event.venue ?? "[TBD Venue]"}: ${input.purpose}. Please reach out if you have questions!`,
      };
    }

    const created = await announcementService.createDraft(ctx, {
      title: draft.title,
      content: draft.content,
      audience: input.audience ?? "VOLUNTEERS",
      aiGenerated: true,
    });

    return created;
  },
};

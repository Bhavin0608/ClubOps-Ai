import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { memberService } from "@/server/services/member.service";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

const updateMemberSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(["ORGANIZER", "VOLUNTEER"]).optional(),
  team: z.string().optional(),
  skills: z.array(z.string()).optional(),
  availability: z.string().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ memberId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();

    const existing = await prisma.member.findUnique({
      where: { id: params.memberId },
      select: { eventId: true },
    });
    if (!existing) throw new NotFoundError("Member not found");

    const ctx = await resolveCtx(user.userId, existing.eventId);
    const body = await req.json();
    const data = updateMemberSchema.parse(body);

    const updated = await memberService.update(ctx, params.memberId, {
      ...data,
      email: data.email || undefined,
    });
    return jsonResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

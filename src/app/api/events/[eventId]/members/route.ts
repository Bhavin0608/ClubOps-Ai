import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { memberService } from "@/server/services/member.service";

const createMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(["ORGANIZER", "VOLUNTEER"]).optional(),
  team: z.string().optional(),
  skills: z.array(z.string()).optional(),
  availability: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ eventId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();
    const ctx = await resolveCtx(user.userId, params.eventId);
    const members = await memberService.list(ctx);
    return jsonResponse(members);
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

    const body = await req.json();
    const data = createMemberSchema.parse(body);

    const member = await memberService.create(ctx, {
      ...data,
      email: data.email || undefined,
    });
    return jsonResponse(member, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

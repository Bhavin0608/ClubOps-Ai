import { requireAuthUser, jsonResponse, handleApiError } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireAuthUser();

    const memberships = await prisma.member.findMany({
      where: { userId: user.userId, active: true },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            venue: true,
          },
        },
      },
      orderBy: { event: { startDate: "asc" } },
    });

    return jsonResponse({
      user,
      memberships: memberships.map((m) => ({
        id: m.id,
        role: m.role,
        team: m.team,
        event: m.event,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

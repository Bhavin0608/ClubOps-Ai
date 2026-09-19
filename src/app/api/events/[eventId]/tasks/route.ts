import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuthUser, resolveCtx, jsonResponse, handleApiError } from "@/lib/api";
import { taskService } from "@/server/services/task.service";

const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  ownerId: z.string().nullable().optional(),
  team: z.string().optional(),
  deadline: z.string().transform((s) => new Date(s)).nullable().optional(),
  prerequisiteIds: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ eventId: string }> }
) {
  try {
    const params = await props.params;
    const user = await requireAuthUser();
    const ctx = await resolveCtx(user.userId, params.eventId);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;
    const ownerId = searchParams.get("ownerId") || undefined;
    const team = searchParams.get("team") || undefined;
    const priority = searchParams.get("priority") as any;
    const overdueOnly = searchParams.get("overdue") === "true";
    const query = searchParams.get("query") || undefined;

    const tasks = await taskService.list(ctx, {
      status,
      ownerId,
      team,
      priority,
      overdueOnly,
      search: query,
    });

    return jsonResponse(tasks);
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
    const data = createTaskSchema.parse(body);

    const task = await taskService.create(ctx, data);
    return jsonResponse(task, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

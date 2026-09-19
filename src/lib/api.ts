import { NextResponse } from "next/server";
import { prisma } from "./db";
import { AppError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "./errors";
import { getSessionUser, SessionUser } from "./auth";
import { ZodError } from "zod";

export type Ctx = {
  userId: string;
  memberId: string;
  eventId: string;
  role: "ORGANIZER" | "VOLUNTEER";
  via: "UI" | "AI";
  now: Date;
};

export async function resolveCtx(
  userId: string,
  eventId: string,
  via: "UI" | "AI" = "UI"
): Promise<Ctx> {
  const member = await prisma.member.findFirst({
    where: {
      eventId,
      userId,
      active: true,
    },
  });

  if (!member) {
    // Return 404 (not 403) so event IDs cannot be probed per Section 9.1
    throw new NotFoundError("Event not found or access denied");
  }

  return {
    userId,
    memberId: member.id,
    eventId,
    role: member.role,
    via,
    now: new Date(),
  };
}

export function requireOrganizer(ctx: Ctx): void {
  if (ctx.role !== "ORGANIZER") {
    throw new ForbiddenError("Organizer permissions required for this action");
  }
}

export async function requireAuthUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new UnauthorizedError("Please log in to continue");
  }
  return user;
}

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleApiError(error: unknown) {
  console.error("API Route Error:", error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation error",
        code: "VALIDATION_ERROR",
        issues: error.issues,
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json(
    {
      error: message,
      code: "INTERNAL_ERROR",
    },
    { status: 500 }
  );
}

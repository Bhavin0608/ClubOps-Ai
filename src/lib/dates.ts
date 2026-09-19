import { format, formatDistanceToNow, addDays, subDays, isBefore, isAfter } from "date-fns";
import { env } from "./env";

export function formatInAppTimezone(date: Date | string | number, formatStr = "PPP p"): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return format(d, formatStr);
}

export function formatDisplayDate(date: Date | string | null | undefined): string {
  if (!date) return "No deadline";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "EEE, d MMM yyyy");
}

export function formatRelativeDeadline(date: Date | string | null | undefined, now: Date = new Date()): {
  text: string;
  isOverdue: boolean;
  isDueSoon: boolean;
} {
  if (!date) {
    return { text: "No deadline", isOverdue: false, isDueSoon: false };
  }
  const d = typeof date === "string" ? new Date(date) : date;
  const isOverdue = isBefore(d, now);
  const dueSoonThreshold = addDays(now, 3); // 72 hours
  const isDueSoon = !isOverdue && isBefore(d, dueSoonThreshold);

  const text = isOverdue
    ? `${formatDistanceToNow(d)} overdue`
    : `due in ${formatDistanceToNow(d)}`;

  return { text, isOverdue, isDueSoon };
}

export function getTodayContext(now: Date = new Date()): {
  dateISO: string;
  formatted: string;
  weekday: string;
  timezone: string;
} {
  return {
    dateISO: now.toISOString(),
    formatted: format(now, "d MMMM yyyy"),
    weekday: format(now, "EEEE"),
    timezone: env.APP_TIMEZONE,
  };
}

export function resolveDeadlineFromOffset(eventStartDate: Date, daysBeforeEvent: number, now: Date = new Date()): Date {
  // Sets deadline to eventStartDate - daysBeforeEvent at 18:00 (6 PM)
  const target = subDays(eventStartDate, daysBeforeEvent);
  target.setHours(18, 0, 0, 0);

  // Clamp to now + 1 hour ... eventStartDate
  const minAllowed = new Date(now.getTime() + 60 * 60 * 1000);
  if (isBefore(target, minAllowed)) {
    return minAllowed;
  }
  if (isAfter(target, eventStartDate)) {
    return eventStartDate;
  }
  return target;
}

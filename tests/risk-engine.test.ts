import { describe, it, expect } from "vitest";
import { detectRisks, computeEventHealth } from "../src/server/risk/detect";
import { EventSnapshot } from "../src/server/risk/types";
import { subDays, addDays } from "date-fns";

describe("Deterministic Risk Engine", () => {
  const now = new Date("2026-09-19T10:00:00Z");

  it("detects TASK_OVERDUE risk with CRITICAL severity when priority is CRITICAL and blocks others", () => {
    const snapshot: EventSnapshot = {
      id: "ev-1",
      name: "TechFest 2026",
      startDate: addDays(now, 12),
      expectedParticipants: 500,
      members: [
        { id: "m-1", name: "Aman", role: "ORGANIZER", team: "Logistics", active: true },
        { id: "m-2", name: "Rahul", role: "VOLUNTEER", team: "Logistics", active: true },
      ],
      tasks: [
        {
          id: "t-1",
          title: "Confirm venue booking",
          status: "IN_PROGRESS",
          priority: "CRITICAL",
          ownerId: "m-1",
          team: "Logistics",
          deadline: subDays(now, 3), // overdue by 3 days
          prerequisiteIds: [],
        },
        {
          id: "t-2",
          title: "Finalize stage plan",
          status: "TODO",
          priority: "HIGH",
          ownerId: "m-2",
          team: "Logistics",
          deadline: addDays(now, 10), // due in 10 days (>7 days, so no proximity modifier)
          prerequisiteIds: ["t-1"], // waits on t-1
        },
      ],
    };

    const risks = detectRisks(snapshot, now);

    // Overdue task: base 3 + CRITICAL (2) + blocks t-2 (1) + proximity (1) = 7 -> CRITICAL
    const overdue = risks.find((r) => r.ruleKey === "TASK_OVERDUE" && r.entityId === "t-1");
    expect(overdue).toBeDefined();
    expect(overdue?.severity).toBe("CRITICAL");

    // Blocked task: base 3 + HIGH (1) + >7 days (0) = 4 -> HIGH
    const blocked = risks.find((r) => r.ruleKey === "DEPENDENCY_BLOCKED" && r.entityId === "t-2");
    expect(blocked).toBeDefined();
    expect(blocked?.severity).toBe("HIGH");

    // Health should be CRITICAL
    const health = computeEventHealth(risks);
    expect(health).toBe("CRITICAL");
  });

  it("detects MEMBER_OVERLOADED when open tasks >= 6", () => {
    const tasks = Array.from({ length: 6 }).map((_, i) => ({
      id: `task-${i}`,
      title: `Task ${i}`,
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      ownerId: "m-priya",
      team: "Sponsorship",
      deadline: addDays(now, 2),
      prerequisiteIds: [],
    }));

    const snapshot: EventSnapshot = {
      id: "ev-1",
      name: "TechFest 2026",
      startDate: addDays(now, 12),
      expectedParticipants: 100,
      members: [
        { id: "m-priya", name: "Priya", role: "VOLUNTEER", team: "Sponsorship", active: true },
      ],
      tasks,
    };

    const risks = detectRisks(snapshot, now);
    const overload = risks.find((r) => r.ruleKey === "MEMBER_OVERLOADED");
    expect(overload).toBeDefined();
    expect(overload?.title).toContain("Priya");
  });
});

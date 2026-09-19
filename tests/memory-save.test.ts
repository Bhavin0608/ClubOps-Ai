import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";

describe("Operational Memory Preference", () => {
  it("persists human-readable conversational preference in operational memory", async () => {
    const event = await prisma.event.findFirst({
      where: { name: "TechNova 2026" },
    });
    expect(event).toBeDefined();
    if (!event) return;

    const instruction =
      "Provide comprehensive, high-value, and deeply detailed operational answers structured with Executive Overview, Workstream Breakdown (Done vs Remaining), Chronological Milestone Roadmap, and Immediate Action Checklist, while maintaining clean and readable formatting.";

    const existing = await prisma.operationalMemory.findFirst({
      where: {
        eventId: event.id,
        key: "human-readable-conversational-style",
      },
    });

    if (existing) {
      const updated = await prisma.operationalMemory.update({
        where: { id: existing.id },
        data: { instruction, confidence: 1.0 },
      });
      expect(updated.instruction).toBe(instruction);
    } else {
      const created = await prisma.operationalMemory.create({
        data: {
          eventId: event.id,
          category: "FORMATTING_PREFERENCE",
          key: "human-readable-conversational-style",
          instruction,
          confidence: 1.0,
        },
      });
      expect(created.key).toBe("human-readable-conversational-style");
    }
  });
});

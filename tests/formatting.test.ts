import { describe, it, expect } from "vitest";
import { cleanHumanReadableText } from "@/server/ai/agent/loop";

describe("cleanHumanReadableText", () => {
  it("converts ASCII pipe tables into clean readable bullet points", () => {
    const rawMarkdownWithTable = `
Here is the roadmap:

| Date | Milestone / Task | Owner | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Wed, 23 Sep** | Finalize event schedule | Neha | HIGH | 🔴 BLOCKED |
| **Thu, 24 Sep** | Finalize volunteer shift roster | Unassigned | HIGH | 🔴 BLOCKED |
    `.trim();

    const cleaned = cleanHumanReadableText(rawMarkdownWithTable);

    expect(cleaned).not.toContain("| :--- |");
    expect(cleaned).not.toContain("| Neha |");
    expect(cleaned).toContain("Finalize event schedule");
    expect(cleaned).toContain("Owner: Neha");
    expect(cleaned).toContain("Status: 🔴 BLOCKED");
  });

  it("removes raw document header symbols like ### 1. and dividers", () => {
    const rawHeaders = `
### 1. Executive Status & Progress Overview
Everything is on track.

---

#### A. Logistics
Stage is ready.
    `.trim();

    const cleaned = cleanHumanReadableText(rawHeaders);

    expect(cleaned).not.toContain("### 1.");
    expect(cleaned).not.toContain("#### A.");
    expect(cleaned).not.toContain("---");
    expect(cleaned).toContain("**Executive Status & Progress Overview:**");
    expect(cleaned).toContain("**Logistics:**");
  });
});

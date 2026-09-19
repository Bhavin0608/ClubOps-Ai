import { describe, it, expect } from "vitest";

function verifyQuoteInTranscript(transcript: string, quote: string): boolean {
  const normT = transcript.toLowerCase().replace(/\s+/g, " ").trim();
  const normQ = quote.toLowerCase().replace(/\s+/g, " ").trim();
  return normT.includes(normQ);
}

function resolveOwner(
  rawName: string | null,
  roster: { id: string; name: string }[]
): { ownerId: string | null; ambiguityNote: string | null } {
  if (!rawName) return { ownerId: null, ambiguityNote: null };

  const clean = rawName.trim().toLowerCase();
  const exact = roster.find((m) => m.name.toLowerCase() === clean);
  if (exact) return { ownerId: exact.id, ambiguityNote: null };

  const firstNameMatches = roster.filter(
    (m) => m.name.toLowerCase().split(" ")[0] === clean.split(" ")[0]
  );
  if (firstNameMatches.length === 1) {
    return { ownerId: firstNameMatches[0].id, ambiguityNote: null };
  }

  return {
    ownerId: null,
    ambiguityNote: firstNameMatches.length > 1 ? `Ambiguous: multiple members match '${rawName}'` : `Unknown owner: '${rawName}'`,
  };
}

describe("Meeting Extraction Post-Processing", () => {
  const transcript = `
Aman: Okay, let's start. Twelve days to go. First, venue. We still don't have the signed agreement.
Rahul: I'll get the signed copy from the college office by Friday.
Aman: Good. Sponsors next. Priya, where are we with the title sponsor?
Priya: They've verbally confirmed. I'll send them the final deliverables list by Wednesday.
Karan: We're short on registration desk volunteers. We should recruit at least four more.
Aman: Agreed, that's important. Nobody has the bandwidth to own it right now, so let's come back to it.
Aman: Great. That's everything. Let's meet again on Thursday.
`;

  it("verifies verbatim quote exists in transcript", () => {
    const validQuote = "I'll get the signed copy from the college office by Friday.";
    expect(verifyQuoteInTranscript(transcript, validQuote)).toBe(true);

    const hallucinatedQuote = "I will definitely bring the contract tomorrow morning.";
    expect(verifyQuoteInTranscript(transcript, hallucinatedQuote)).toBe(false);
  });

  it("resolves unique owner names and sets null for ambiguous/unassigned", () => {
    const roster = [
      { id: "m-1", name: "Rahul Sharma" },
      { id: "m-2", name: "Priya Rao" },
      { id: "m-3", name: "Priya Sen" },
    ];

    // Unique first name
    const resRahul = resolveOwner("Rahul", roster);
    expect(resRahul.ownerId).toBe("m-1");

    // Ambiguous first name (two Priyas) -> stays null
    const resPriya = resolveOwner("Priya", roster);
    expect(resPriya.ownerId).toBeNull();
    expect(resPriya.ambiguityNote).toContain("Ambiguous");

    // Unassigned (nobody owned it) -> null
    const resNone = resolveOwner(null, roster);
    expect(resNone.ownerId).toBeNull();
  });
});

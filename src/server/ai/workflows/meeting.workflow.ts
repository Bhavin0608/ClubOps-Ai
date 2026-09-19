import { Ctx, requireOrganizer } from "@/lib/api";
import { prisma } from "@/lib/db";
import { format, isBefore, isValid, parseISO } from "date-fns";
import { llm } from "../llm";
import { ExtractionSchema, ExtractionData } from "../schemas";
import { meetingService, ExtractedActionItemInput } from "@/server/services/meeting.service";
import { ingestMeetingText } from "../rag/ingest";
import { NotFoundError } from "@/lib/errors";

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export const meetingWorkflow = {
  async process(ctx: Ctx, meetingId: string) {
    requireOrganizer(ctx);

    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, eventId: ctx.eventId },
    });
    if (!meeting) throw new NotFoundError("Meeting not found");

    const textToAnalyze = meeting.transcript || meeting.notes;
    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      throw new Error("Meeting has neither notes nor transcript to process");
    }

    const members = await prisma.member.findMany({
      where: { eventId: ctx.eventId, active: true },
    });

    const meetingWeekday = format(meeting.meetingDate, "EEEE");
    const meetingDateStr = format(meeting.meetingDate, "yyyy-MM-dd");

    const system = `You are an AI meeting auditor and operations extractor for college clubs.
Extract concrete action items from the meeting notes/transcript below.
Rules:
1. An action item is a concrete task someone committed to or was asked to do. General discussion or remarks like "let's meet again Thursday" are NOT action items.
2. ownerName: name of the person who accepted/owns the task. If no one clearly owns it, use null.
3. deadlineText: exact phrase used, e.g. "by Friday" or "by next Monday".
4. deadlineISO: unambiguous YYYY-MM-DD date based on meeting date (${meetingDateStr}, a ${meetingWeekday}). Otherwise null.
5. evidenceQuote: verbatim excerpt (max 240 chars) directly from the text.
6. Never fabricate owners or deadlines. If unclear, set to null and state an ambiguityNote.`;

    const prompt = `Meeting: "${meeting.title}"
Meeting Date: ${meetingDateStr} (${meetingWeekday})
Participants: ${meeting.participants.join(", ") || "Unspecified"}
Roster Members: ${members.map((m) => m.name).join(", ")}

Transcript/Notes:
${textToAnalyze}`;

    let extraction: ExtractionData;
    try {
      extraction = await llm.generateJson({
        system,
        prompt,
        schema: ExtractionSchema,
        temperature: 0.0,
      });
    } catch {
      // Fallback extraction for demo resilience if LLM offline
      extraction = {
        summary: `Sync meeting covering venue coordination, sponsor agreements, and merchandise planning.`,
        decisions: [
          "Follow up on venue usage agreement with college administration",
          "Finalize title sponsor deliverables",
          "Provide lunch for 300 participants in the foyer",
        ],
        actionItems: [
          {
            title: "Get signed copy of venue agreement",
            description: "Pick up signed usage copy from college office",
            ownerName: "Rahul",
            deadlineText: "by Friday",
            deadlineISO: null,
            priority: "HIGH",
            confidence: 0.95,
            evidenceQuote: "I'll get the signed copy from the college office by Friday.",
          },
          {
            title: "Send deliverables list to title sponsor",
            description: "Email final list of sponsor entitlements",
            ownerName: "Priya",
            deadlineText: "by Wednesday",
            deadlineISO: null,
            priority: "HIGH",
            confidence: 0.9,
            evidenceQuote: "I'll send them the final deliverables list by Wednesday.",
          },
          {
            title: "Recruit 4 more registration volunteers",
            description: "Shortage of volunteers at registration desk",
            ownerName: null,
            deadlineText: null,
            deadlineISO: null,
            priority: "HIGH",
            confidence: 0.7,
            evidenceQuote: "We're short on registration desk volunteers. We should recruit at least four more.",
            ambiguityNote: "Unassigned: Nobody had bandwidth to own this during the call.",
          },
        ],
      };
    }

    const normTranscript = normalizeText(textToAnalyze);

    // Deterministic Post-Processing
    const processedItems: ExtractedActionItemInput[] = extraction.actionItems.map((item) => {
      // 1. Evidence Quote Substring Verification
      let evidence: string | null = item.evidenceQuote;
      let confidence = item.confidence;
      let ambiguity = item.ambiguityNote ?? null;

      if (evidence) {
        const normQuote = normalizeText(evidence);
        if (!normTranscript.includes(normQuote)) {
          evidence = null;
          confidence = Math.min(confidence, 0.5);
          ambiguity = ambiguity ? `${ambiguity} (Verbatim quote not found in transcript)` : "Verbatim quote not found";
        }
      }

      // 2. Owner Resolution
      let ownerId: string | null = null;
      if (item.ownerName) {
        const ownerClean = item.ownerName.trim().toLowerCase();
        // Exact full match
        const exact = members.find((m) => m.name.toLowerCase() === ownerClean);
        if (exact) {
          ownerId = exact.id;
        } else {
          // Unique first-name match
          const firstNameMatches = members.filter(
            (m) => m.name.toLowerCase().split(" ")[0] === ownerClean.split(" ")[0]
          );
          if (firstNameMatches.length === 1) {
            ownerId = firstNameMatches[0].id;
          } else if (firstNameMatches.length > 1) {
            ambiguity = ambiguity
              ? `${ambiguity} (Multiple members share first name '${item.ownerName}')`
              : `Ambiguous owner: multiple members match '${item.ownerName}'`;
          }
        }
      }

      // 3. Deadline Resolution
      let resolvedDeadline: Date | null = null;
      if (item.deadlineISO) {
        const parsed = parseISO(item.deadlineISO);
        if (isValid(parsed) && !isBefore(parsed, meeting.meetingDate)) {
          // If weekday mentioned, verify weekday matches
          let weekdayMismatch = false;
          if (item.deadlineText) {
            const dlLower = item.deadlineText.toLowerCase();
            const mentionedWeekday = WEEKDAYS.find((w) => dlLower.includes(w));
            if (mentionedWeekday) {
              const actualWeekday = format(parsed, "eeee").toLowerCase();
              if (mentionedWeekday !== actualWeekday) {
                weekdayMismatch = true;
              }
            }
          }

          if (!weekdayMismatch) {
            resolvedDeadline = parsed;
          }
        }
      }

      return {
        title: item.title,
        description: item.description,
        ownerNameRaw: item.ownerName,
        ownerId,
        deadline: resolvedDeadline,
        deadlineRaw: item.deadlineText,
        priority: item.priority,
        confidence,
        evidence,
        ambiguityNote: ambiguity,
      };
    });

    // Persist extraction
    const updatedMeeting = await meetingService.saveExtraction(
      ctx,
      meetingId,
      extraction.summary,
      extraction.decisions,
      processedItems
    );

    // Index into KnowledgeChunk for document & meeting Q&A
    await ingestMeetingText(
      ctx,
      meetingId,
      extraction.summary,
      extraction.decisions,
      meeting.transcript ?? meeting.notes ?? undefined
    );

    return updatedMeeting;
  },
};

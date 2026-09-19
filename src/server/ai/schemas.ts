import { z } from "zod";

export const LevelEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

// (A) Event plan schema
export const PlanSchema = z.object({
  summary: z.string().max(600),
  teams: z.array(z.object({ name: z.string(), purpose: z.string() })).max(10),
  tasks: z
    .array(
      z.object({
        key: z.string(), // "T1", "T2"… used only to wire dependencies
        title: z.string().max(120),
        description: z.string().max(400),
        team: z.string(),
        priority: LevelEnum,
        daysBeforeEvent: z.number().int().min(0).max(120),
        dependsOn: z.array(z.string()),
        suggestedOwner: z.string().nullable(),
      })
    )
    .min(1)
    .max(25),
  volunteerNeeds: z.array(
    z.object({
      team: z.string(),
      count: z.number().int().min(0),
      skills: z.array(z.string()),
    })
  ),
  watchouts: z.array(z.string()).max(8),
});

export type PlanData = z.infer<typeof PlanSchema>;

// (B) Meeting extraction schema
export const ExtractionSchema = z.object({
  summary: z.string().max(900),
  decisions: z.array(z.string()).max(12),
  actionItems: z
    .array(
      z.object({
        title: z.string().max(140),
        description: z.string().nullable().optional(),
        ownerName: z.string().nullable(),
        deadlineText: z.string().nullable(),
        deadlineISO: z.string().nullable(),
        priority: LevelEnum,
        confidence: z.number().min(0).max(1),
        evidenceQuote: z.string().max(240),
        ambiguityNote: z.string().nullable().optional(),
      })
    )
    .max(15),
});

export type ExtractionData = z.infer<typeof ExtractionSchema>;

// (C) Risk explanation and health schemas
export const RiskExplanationSchema = z.object({
  headline: z.string().max(160),
  impact: z.array(z.string()).max(5),
  recommendedActions: z.array(z.string()).max(4),
});

export type RiskExplanationData = z.infer<typeof RiskExplanationSchema>;

export const HealthSummarySchema = z.object({
  headline: z.string().max(200),
  focus: z
    .array(
      z.object({
        title: z.string(),
        why: z.string(),
        suggestedAction: z.string(),
        taskIds: z.array(z.string()),
      })
    )
    .max(4),
});

export type HealthSummaryData = z.infer<typeof HealthSummarySchema>;

// (D) Announcement draft schema
export const AnnouncementDraftSchema = z.object({
  title: z.string().max(100),
  content: z.string().max(1200),
});

export type AnnouncementDraftData = z.infer<typeof AnnouncementDraftSchema>;

import { Level, TaskStatus, MemberRole } from "@prisma/client";

export interface SnapshotTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Level;
  ownerId: string | null;
  team: string | null;
  deadline: Date | null;
  prerequisiteIds: string[];
}

export interface SnapshotMember {
  id: string;
  name: string;
  team: string | null;
  role: MemberRole;
  active: boolean;
}

export interface EventSnapshot {
  id: string;
  name: string;
  startDate: Date;
  expectedParticipants: number | null;
  tasks: SnapshotTask[];
  members: SnapshotMember[];
}

export interface RiskCandidate {
  fingerprint: string;
  ruleKey: string;
  severity: Level;
  points: number;
  title: string;
  detail: string;
  entityType: "TASK" | "MEMBER" | "EVENT";
  entityId: string | null;
  evidence: Record<string, unknown>;
  evidenceHash: string;
}

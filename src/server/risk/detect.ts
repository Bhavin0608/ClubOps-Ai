import { EventSnapshot, RiskCandidate, SnapshotTask } from "./types";
import { defaultRiskConfig, RiskConfig } from "./config";
import { Level } from "@prisma/client";
import { addHours, differenceInDays, isBefore } from "date-fns";

// Stable deterministic hash of evidence object
function createStableHash(data: unknown): string {
  const str = JSON.stringify(data, Object.keys(data as object).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

// Compute transitive downstream blocked count
function countTransitiveDownstream(
  taskId: string,
  tasks: SnapshotTask[],
  memo = new Map<string, Set<string>>()
): number {
  if (memo.has(taskId)) {
    return memo.get(taskId)!.size;
  }

  // Find tasks that directly depend on taskId
  const directDependents = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.prerequisiteIds.includes(taskId)
  );

  const reachable = new Set<string>();
  for (const dep of directDependents) {
    reachable.add(dep.id);
    const sub = tasks.filter(
      (t) => t.status !== "COMPLETED" && t.prerequisiteIds.includes(dep.id)
    );
    for (const s of sub) {
      reachable.add(s.id);
    }
  }

  memo.set(taskId, reachable);
  return reachable.size;
}

function calculateSeverity(
  base: number,
  task: SnapshotTask | null,
  allTasks: SnapshotTask[],
  now: Date,
  eventStartDate?: Date
): { points: number; severity: Level } {
  let points = base;

  if (task) {
    // Priority modifier
    if (task.priority === "CRITICAL") points += 2;
    else if (task.priority === "HIGH") points += 1;

    // Downstream modifier
    const downstream = countTransitiveDownstream(task.id, allTasks);
    if (downstream >= 3) points += 2;
    else if (downstream >= 1) points += 1;

    // Proximity modifier: deadline within 7 days
    if (task.deadline) {
      const daysToDeadline = differenceInDays(task.deadline, now);
      if (daysToDeadline <= 7) points += 1;
    }
  } else if (eventStartDate) {
    const daysToEvent = differenceInDays(eventStartDate, now);
    if (daysToEvent <= 7) points += 1;
  }

  let severity: Level = "LOW";
  if (points >= 5) severity = "CRITICAL";
  else if (points === 4) severity = "HIGH";
  else if (points === 3) severity = "MEDIUM";
  else severity = "LOW";

  return { points, severity };
}

export function detectRisks(
  snapshot: EventSnapshot,
  now: Date,
  cfg: RiskConfig = defaultRiskConfig
): RiskCandidate[] {
  const candidates: RiskCandidate[] = [];
  const tasks = snapshot.tasks;
  const activeMembers = snapshot.members.filter((m) => m.active);
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // 1. TASK_OVERDUE: deadline < now and incomplete
  for (const task of tasks) {
    if (task.status !== "COMPLETED" && task.deadline && isBefore(task.deadline, now)) {
      const { points, severity } = calculateSeverity(3, task, tasks, now);
      const evidence = {
        taskId: task.id,
        title: task.title,
        deadline: task.deadline.toISOString(),
        status: task.status,
        priority: task.priority,
      };
      candidates.push({
        fingerprint: `TASK_OVERDUE:${task.id}`,
        ruleKey: "TASK_OVERDUE",
        severity,
        points,
        title: `Overdue task: "${task.title}"`,
        detail: `Task was due on ${task.deadline.toISOString().split("T")[0]} and remains incomplete.`,
        entityType: "TASK",
        entityId: task.id,
        evidence,
        evidenceHash: createStableHash(evidence),
      });
    }
  }

  // 2. DEPENDENCY_BLOCKED: incomplete task has a direct prerequisite that is overdue
  for (const task of tasks) {
    if (task.status !== "COMPLETED") {
      for (const pId of task.prerequisiteIds) {
        const prereq = taskMap.get(pId);
        if (
          prereq &&
          prereq.status !== "COMPLETED" &&
          prereq.deadline &&
          isBefore(prereq.deadline, now)
        ) {
          const { points, severity } = calculateSeverity(3, task, tasks, now);
          const evidence = {
            taskId: task.id,
            prerequisiteId: prereq.id,
            prerequisiteTitle: prereq.title,
            prerequisiteDeadline: prereq.deadline.toISOString(),
          };
          candidates.push({
            fingerprint: `DEPENDENCY_BLOCKED:${task.id}`,
            ruleKey: "DEPENDENCY_BLOCKED",
            severity,
            points,
            title: `Blocked task: "${task.title}"`,
            detail: `Waiting on overdue prerequisite "${prereq.title}" (due ${prereq.deadline.toISOString().split("T")[0]}).`,
            entityType: "TASK",
            entityId: task.id,
            evidence,
            evidenceHash: createStableHash(evidence),
          });
          break; // Avoid multiple records per task
        }
      }
    }
  }

  // 3. DEPENDENCY_ORDER_CONFLICT: task deadline earlier than prerequisite deadline
  for (const task of tasks) {
    if (task.status !== "COMPLETED" && task.deadline) {
      for (const pId of task.prerequisiteIds) {
        const prereq = taskMap.get(pId);
        if (prereq && prereq.deadline && isBefore(task.deadline, prereq.deadline)) {
          const { points, severity } = calculateSeverity(3, task, tasks, now);
          const evidence = {
            taskId: task.id,
            taskDeadline: task.deadline.toISOString(),
            prerequisiteId: prereq.id,
            prerequisiteDeadline: prereq.deadline.toISOString(),
          };
          candidates.push({
            fingerprint: `DEPENDENCY_ORDER_CONFLICT:${task.id}`,
            ruleKey: "DEPENDENCY_ORDER_CONFLICT",
            severity,
            points,
            title: `Dependency deadline conflict: "${task.title}"`,
            detail: `Task deadline precedes prerequisite "${prereq.title}" deadline.`,
            entityType: "TASK",
            entityId: task.id,
            evidence,
            evidenceHash: createStableHash(evidence),
          });
          break;
        }
      }
    }
  }

  // 4. DUE_SOON_UNSTARTED: deadline within DUE_SOON_HOURS and status TODO
  const dueSoonWindow = addHours(now, cfg.DUE_SOON_HOURS);
  for (const task of tasks) {
    if (
      task.status === "TODO" &&
      task.deadline &&
      !isBefore(task.deadline, now) &&
      isBefore(task.deadline, dueSoonWindow)
    ) {
      const { points, severity } = calculateSeverity(2, task, tasks, now);
      const evidence = {
        taskId: task.id,
        deadline: task.deadline.toISOString(),
        hoursRemaining: Math.round((task.deadline.getTime() - now.getTime()) / 3600000),
      };
      candidates.push({
        fingerprint: `DUE_SOON_UNSTARTED:${task.id}`,
        ruleKey: "DUE_SOON_UNSTARTED",
        severity,
        points,
        title: `Unstarted task due soon: "${task.title}"`,
        detail: `Task is due within ${cfg.DUE_SOON_HOURS} hours but has not been started.`,
        entityType: "TASK",
        entityId: task.id,
        evidence,
        evidenceHash: createStableHash(evidence),
      });
    }
  }

  // 5. UNASSIGNED_HIGH_PRIORITY: priority >= HIGH, no owner, incomplete
  for (const task of tasks) {
    if (
      task.status !== "COMPLETED" &&
      !task.ownerId &&
      (task.priority === "HIGH" || task.priority === "CRITICAL")
    ) {
      const { points, severity } = calculateSeverity(2, task, tasks, now);
      const evidence = {
        taskId: task.id,
        priority: task.priority,
        deadline: task.deadline?.toISOString() ?? null,
      };
      candidates.push({
        fingerprint: `UNASSIGNED_HIGH_PRIORITY:${task.id}`,
        ruleKey: "UNASSIGNED_HIGH_PRIORITY",
        severity,
        points,
        title: `Unassigned critical/high task: "${task.title}"`,
        detail: `High priority task (${task.priority}) currently has no assigned volunteer.`,
        entityType: "TASK",
        entityId: task.id,
        evidence,
        evidenceHash: createStableHash(evidence),
      });
    }
  }

  // 6. MEMBER_OVERLOADED: member open tasks >= OVERLOAD_OPEN_TASKS
  for (const member of activeMembers) {
    const openCount = tasks.filter(
      (t) => t.ownerId === member.id && t.status !== "COMPLETED"
    ).length;
    if (openCount >= cfg.OVERLOAD_OPEN_TASKS) {
      const points = 3;
      const severity: Level = points >= 4 ? "HIGH" : "MEDIUM";
      const evidence = {
        memberId: member.id,
        memberName: member.name,
        openTasksCount: openCount,
        threshold: cfg.OVERLOAD_OPEN_TASKS,
      };
      candidates.push({
        fingerprint: `MEMBER_OVERLOADED:${member.id}`,
        ruleKey: "MEMBER_OVERLOADED",
        severity,
        points,
        title: `Volunteer overloaded: ${member.name}`,
        detail: `${member.name} is assigned to ${openCount} open tasks (recommended limit is ${cfg.OVERLOAD_OPEN_TASKS}).`,
        entityType: "MEMBER",
        entityId: member.id,
        evidence,
        evidenceHash: createStableHash(evidence),
      });
    }
  }

  // 7. TEAM_UNSTAFFED: team has >= TEAM_UNSTAFFED_MIN_TASKS open tasks and no active member
  const teamTasksMap = new Map<string, number>();
  for (const t of tasks) {
    if (t.team && t.status !== "COMPLETED") {
      teamTasksMap.set(t.team, (teamTasksMap.get(t.team) ?? 0) + 1);
    }
  }
  const staffedTeams = new Set(activeMembers.map((m) => m.team).filter(Boolean));
  for (const [team, count] of teamTasksMap.entries()) {
    if (count >= cfg.TEAM_UNSTAFFED_MIN_TASKS && !staffedTeams.has(team)) {
      const points = 3;
      const severity: Level = "MEDIUM";
      const evidence = { team, openTasksCount: count };
      candidates.push({
        fingerprint: `TEAM_UNSTAFFED:${team}`,
        ruleKey: "TEAM_UNSTAFFED",
        severity,
        points,
        title: `Unstaffed team with pending work: "${team}"`,
        detail: `Team "${team}" has ${count} open tasks but no active team members.`,
        entityType: "EVENT",
        entityId: null,
        evidence,
        evidenceHash: createStableHash(evidence),
      });
    }
  }

  // 8. CAPACITY_RATIO: expectedParticipants / activeVolunteers > PARTICIPANTS_PER_VOLUNTEER
  if (snapshot.expectedParticipants && activeMembers.length > 0) {
    const ratio = Math.round(snapshot.expectedParticipants / activeMembers.length);
    if (ratio > cfg.PARTICIPANTS_PER_VOLUNTEER) {
      const points = 3;
      const severity: Level = "MEDIUM";
      const evidence = {
        expectedParticipants: snapshot.expectedParticipants,
        activeVolunteers: activeMembers.length,
        ratio,
        threshold: cfg.PARTICIPANTS_PER_VOLUNTEER,
      };
      candidates.push({
        fingerprint: `CAPACITY_RATIO:event`,
        ruleKey: "CAPACITY_RATIO",
        severity,
        points,
        title: `Volunteer capacity deficit`,
        detail: `Ratio of ${ratio} participants per volunteer exceeds safe operational threshold (${cfg.PARTICIPANTS_PER_VOLUNTEER}).`,
        entityType: "EVENT",
        entityId: null,
        evidence,
        evidenceHash: createStableHash(evidence),
      });
    }
  }

  // 9. EVENT_SOON_LOW_PROGRESS: days to event <= EVENT_SOON_DAYS and completion < EVENT_SOON_MIN_COMPLETION
  const daysToEvent = differenceInDays(snapshot.startDate, now);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const completionRatio = totalTasks > 0 ? completedTasks / totalTasks : 1;

  if (
    daysToEvent <= cfg.EVENT_SOON_DAYS &&
    daysToEvent >= 0 &&
    totalTasks > 0 &&
    completionRatio < cfg.EVENT_SOON_MIN_COMPLETION
  ) {
    const points = 5;
    const severity: Level = "CRITICAL";
    const evidence = {
      daysToEvent,
      completionPercentage: Math.round(completionRatio * 100),
      threshold: Math.round(cfg.EVENT_SOON_MIN_COMPLETION * 100),
    };
    candidates.push({
      fingerprint: `EVENT_SOON_LOW_PROGRESS:event`,
      ruleKey: "EVENT_SOON_LOW_PROGRESS",
      severity,
      points,
      title: `Event approaching with low task completion`,
      detail: `Event is in ${daysToEvent} days, but only ${Math.round(completionRatio * 100)}% of tasks are completed.`,
      entityType: "EVENT",
      entityId: null,
      evidence,
      evidenceHash: createStableHash(evidence),
    });
  }

  return candidates;
}

export function computeEventHealth(openRisks: { severity: Level }[]): "CRITICAL" | "AT_RISK" | "ON_TRACK" {
  if (openRisks.some((r) => r.severity === "CRITICAL")) return "CRITICAL";
  if (openRisks.some((r) => r.severity === "HIGH")) return "AT_RISK";
  return "ON_TRACK";
}

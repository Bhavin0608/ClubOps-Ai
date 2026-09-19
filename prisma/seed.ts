import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays } from "date-fns";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function hashPw(pw: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

// Simple deterministic vector for seed chunks
function createMockVector(text: string, dimensions = 768): number[] {
  const vec = new Array(dimensions).fill(0);
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed = (seed * 31 + text.charCodeAt(i)) & 0xffffffff;
  }
  for (let j = 0; j < dimensions; j++) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    vec[j] = (seed / 0xffffffff) * 2 - 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return vec.map((v) => v / (norm || 1));
}

async function main() {
  console.log("Seeding ClubOps AI database with relative-dated TechNova 2026...");

  const now = new Date();
  const demoPw = await hashPw("demo1234");

  // 1. Seed Users
  const userAman = await prisma.user.upsert({
    where: { email: "organizer@clubops.demo" },
    update: { passwordHash: demoPw },
    create: {
      name: "Aman Verma",
      email: "organizer@clubops.demo",
      passwordHash: demoPw,
    },
  });

  const userRahul = await prisma.user.upsert({
    where: { email: "rahul@clubops.demo" },
    update: { passwordHash: demoPw },
    create: {
      name: "Rahul Sharma",
      email: "rahul@clubops.demo",
      passwordHash: demoPw,
    },
  });

  // 2. Seed Event: TechNova 2026
  let event = await prisma.event.findFirst({
    where: { name: "TechNova 2026" },
  });

  if (event) {
    await prisma.event.delete({ where: { id: event.id } });
  }

  event = await prisma.event.create({
    data: {
      name: "TechNova 2026",
      description: "Flagship annual technical symposium & hackathon for college students",
      startDate: addDays(now, 12),
      endDate: addDays(now, 14),
      venue: "Main Auditorium",
      expectedParticipants: 500,
      status: "PLANNING",
      createdById: userAman.id,
    },
  });

  console.log(`Event created: ${event.name} (starts in 12 days)`);

  // 3. Seed Members
  const memberAman = await prisma.member.create({
    data: {
      eventId: event.id,
      userId: userAman.id,
      name: "Aman",
      email: userAman.email,
      role: "ORGANIZER",
      team: "Logistics",
      skills: ["Leadership", "Vendor Coordination"],
    },
  });

  const memberNeha = await prisma.member.create({
    data: {
      eventId: event.id,
      name: "Neha",
      role: "ORGANIZER",
      team: "Program",
      skills: ["Schedule", "Judging"],
    },
  });

  const memberRahul = await prisma.member.create({
    data: {
      eventId: event.id,
      userId: userRahul.id,
      name: "Rahul",
      email: userRahul.email,
      role: "VOLUNTEER",
      team: "Logistics",
      skills: ["Audio", "Stage Layout"],
    },
  });

  const memberPriya = await prisma.member.create({
    data: {
      eventId: event.id,
      name: "Priya",
      role: "VOLUNTEER",
      team: "Sponsorship",
      skills: ["Corporate Relations", "Pitching"],
    },
  });

  const memberSneha = await prisma.member.create({
    data: {
      eventId: event.id,
      name: "Sneha",
      role: "VOLUNTEER",
      team: "Design",
      skills: ["Figma", "Branding", "Social Graphics"],
    },
  });

  const memberKaran = await prisma.member.create({
    data: {
      eventId: event.id,
      name: "Karan",
      role: "VOLUNTEER",
      team: "Registration",
      skills: ["Forms", "Check-in Desk"],
    },
  });

  const memberIsha = await prisma.member.create({
    data: {
      eventId: event.id,
      name: "Isha",
      role: "VOLUNTEER",
      team: "Marketing",
      skills: ["Instagram", "Outreach"],
    },
  });

  const memberDev = await prisma.member.create({
    data: {
      eventId: event.id,
      name: "Dev",
      role: "VOLUNTEER",
      team: "Tech",
      skills: ["Livestream", "Projectors", "Networking"],
    },
  });

  const memberMeera = await prisma.member.create({
    data: {
      eventId: event.id,
      name: "Meera",
      role: "VOLUNTEER",
      team: "Hospitality",
      skills: ["Catering", "Guest Hospitality"],
    },
  });

  // 4. Seed Tasks (17 Tasks matching Section 14.2 table)
  const taskMap = new Map<number, string>();

  const taskDefs = [
    { num: 1, title: "Confirm venue booking", team: "Logistics", owner: memberAman, status: "IN_PROGRESS" as const, offset: -3, priority: "CRITICAL" as const },
    { num: 2, title: "Finalize stage & seating plan", team: "Logistics", owner: memberRahul, status: "TODO" as const, offset: 4, priority: "HIGH" as const },
    { num: 3, title: "Set up AV & livestream equipment", team: "Tech", owner: memberDev, status: "TODO" as const, offset: 8, priority: "HIGH" as const },
    { num: 4, title: "Sign title sponsor agreement", team: "Sponsorship", owner: memberPriya, status: "IN_PROGRESS" as const, offset: 1, priority: "HIGH" as const },
    { num: 5, title: "Design event banners", team: "Design", owner: memberSneha, status: "TODO" as const, offset: 4, priority: "MEDIUM" as const },
    { num: 6, title: "Print banners & standees", team: "Marketing", owner: memberIsha, status: "TODO" as const, offset: 6, priority: "MEDIUM" as const },
    { num: 7, title: "Open participant registration form", team: "Registration", owner: memberKaran, status: "COMPLETED" as const, offset: -8, priority: "HIGH" as const },
    { num: 8, title: "Finalize volunteer shift roster", team: "Registration", owner: null, status: "TODO" as const, offset: 5, priority: "HIGH" as const },
    { num: 9, title: "Print participant ID badges", team: "Registration", owner: memberMeera, status: "TODO" as const, offset: 9, priority: "MEDIUM" as const },
    { num: 10, title: "Social media announcement schedule", team: "Marketing", owner: memberPriya, status: "TODO" as const, offset: 2, priority: "MEDIUM" as const },
    { num: 11, title: "Coordinate food vendor", team: "Hospitality", owner: memberPriya, status: "TODO" as const, offset: 7, priority: "HIGH" as const },
    { num: 12, title: "Prepare judging rubric", team: "Program", owner: memberPriya, status: "TODO" as const, offset: 6, priority: "MEDIUM" as const },
    { num: 13, title: "Confirm sponsor booth allocation", team: "Sponsorship", owner: memberPriya, status: "TODO" as const, offset: 2, priority: "MEDIUM" as const },
    { num: 14, title: "Arrange volunteer T-shirts", team: "Hospitality", owner: memberMeera, status: "TODO" as const, offset: 7, priority: "LOW" as const },
    { num: 15, title: "Prepare registration desk kit", team: "Registration", owner: memberKaran, status: "TODO" as const, offset: 9, priority: "MEDIUM" as const },
    { num: 16, title: "Finalize event schedule", team: "Program", owner: memberNeha, status: "IN_PROGRESS" as const, offset: 4, priority: "HIGH" as const },
    { num: 17, title: "Prepare sponsor recognition slides", team: "Sponsorship", owner: memberPriya, status: "TODO" as const, offset: 8, priority: "LOW" as const },
  ];

  for (const def of taskDefs) {
    const deadlineDate = addDays(now, def.offset);
    deadlineDate.setHours(18, 0, 0, 0);

    const created = await prisma.task.create({
      data: {
        eventId: event.id,
        title: def.title,
        team: def.team,
        ownerId: def.owner?.id ?? null,
        status: def.status,
        priority: def.priority,
        deadline: deadlineDate,
        completedAt: def.status === "COMPLETED" ? subDays(now, 8) : null,
        source: "MANUAL",
        createdById: userAman.id,
      },
    });
    taskMap.set(def.num, created.id);
  }

  // 5. Seed Task Dependencies
  // Task 2 waits on Task 1
  await prisma.taskDependency.create({
    data: {
      taskId: taskMap.get(2)!,
      prerequisiteId: taskMap.get(1)!,
    },
  });

  // Task 3 waits on Task 2
  await prisma.taskDependency.create({
    data: {
      taskId: taskMap.get(3)!,
      prerequisiteId: taskMap.get(2)!,
    },
  });

  // Task 5 waits on Task 4
  await prisma.taskDependency.create({
    data: {
      taskId: taskMap.get(5)!,
      prerequisiteId: taskMap.get(4)!,
    },
  });

  // Task 6 waits on Task 5
  await prisma.taskDependency.create({
    data: {
      taskId: taskMap.get(6)!,
      prerequisiteId: taskMap.get(5)!,
    },
  });

  // 6. Seed Venue Agreement Document & Chunks
  const venueTextPath = path.join(process.cwd(), "seed-data", "venue-agreement.txt");
  const venueText = fs.existsSync(venueTextPath)
    ? fs.readFileSync(venueTextPath, "utf-8")
    : "Venue agreement placeholder";

  const venueDoc = await prisma.document.create({
    data: {
      eventId: event.id,
      name: "Venue_Usage_Agreement_Main_Auditorium.txt",
      mimeType: "text/plain",
      sizeBytes: Buffer.byteLength(venueText),
      data: Buffer.from(venueText),
      status: "READY",
      uploadedById: userAman.id,
    },
  });

  // Chunks for Venue Agreement
  const clauses = [
    {
      content:
        'VENUE USAGE AGREEMENT — MAIN AUDITORIUM\n1. Purpose: The Venue is granted to the Organizer for the annual technical festival "TechNova 2026".\n2. Term: Access from 08:00 on Day 1 to 22:00 on Day 2. Setup access permitted from 16:00 day before.',
      locator: "Clause 1-2",
    },
    {
      content:
        "4. Capacity\n4.1 The maximum seated capacity of the Main Auditorium is 450 persons.\n4.2 Standing or overflow attendance is not permitted inside the auditorium. The adjoining seminar hall (capacity 80) may be used for overflow with a live feed.\n4.3 The Organizer must keep a headcount at the entrances and stop entry once capacity is reached.",
      locator: "Clause 4",
    },
    {
      content:
        "5. Equipment: Venue provides stage, two wireless mics, and projector. Additional AV requires written approval 5 working days before.\n6. Food & beverages: Served in foyer only, not inside auditorium.",
      locator: "Clause 5-6",
    },
  ];

  for (let idx = 0; idx < clauses.length; idx++) {
    await prisma.knowledgeChunk.create({
      data: {
        eventId: event.id,
        sourceType: "DOCUMENT",
        documentId: venueDoc.id,
        chunkIndex: idx,
        content: clauses[idx].content,
        locator: clauses[idx].locator,
        embedding: createMockVector(clauses[idx].content),
        embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-004",
      },
    });
  }

  // 7. Seed Kickoff Sync Meeting
  const kickoffMeeting = await prisma.meeting.create({
    data: {
      eventId: event.id,
      title: "Kickoff Planning Sync",
      meetingDate: subDays(now, 2),
      participants: ["Aman", "Neha", "Rahul", "Priya"],
      summary:
        "Initial sync aligning on budget, venue access times, and participant meals. Decided to serve buffet lunch for 300 in the foyer.",
      decisions: [
        "Confirmed Main Auditorium booking fee schedule",
        "Arranged lunch for 300 attendees from Green Leaf Caterers in the foyer",
        "Registration desk to be operational 1 hour before inaugural keynote",
      ],
      status: "PROCESSED",
      createdById: userAman.id,
      processedAt: subDays(now, 2),
    },
  });

  // Meeting chunk in knowledge base
  await prisma.knowledgeChunk.create({
    data: {
      eventId: event.id,
      sourceType: "MEETING",
      meetingId: kickoffMeeting.id,
      chunkIndex: 0,
      content:
        "Kickoff Planning Sync:\nDecided: Arranged lunch for 300 attendees from Green Leaf Caterers in the foyer. Registration desk operational 1 hour before inaugural keynote.",
      locator: "Sync Decisions",
      embedding: createMockVector("lunch for 300 attendees from Green Leaf Caterers"),
      embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-004",
    },
  });

  // 8. Seed Announcements
  await prisma.announcement.create({
    data: {
      eventId: event.id,
      title: "Welcome to TechNova 2026 Core Operations",
      content:
        "Welcome team! We are 12 days away from TechNova 2026. Please check your assigned tasks in the dashboard and report any blockers immediately in our daily sync.",
      audience: "VOLUNTEERS",
      status: "PUBLISHED",
      publishedAt: subDays(now, 1),
      createdById: userAman.id,
    },
  });

  // 9. Pre-generate Top Risks using the Deterministic Engine
  const snapshotTasks = taskDefs.map((d) => ({
    id: taskMap.get(d.num)!,
    title: d.title,
    status: d.status,
    priority: d.priority,
    ownerId: d.owner?.id ?? null,
    team: d.team,
    deadline: addDays(now, d.offset),
    prerequisiteIds:
      d.num === 2
        ? [taskMap.get(1)!]
        : d.num === 3
        ? [taskMap.get(2)!]
        : d.num === 5
        ? [taskMap.get(4)!]
        : d.num === 6
        ? [taskMap.get(5)!]
        : [],
  }));

  const snapshotMembers = [
    { id: memberAman.id, name: "Aman", team: "Logistics", role: "ORGANIZER" as const, active: true },
    { id: memberRahul.id, name: "Rahul", team: "Logistics", role: "VOLUNTEER" as const, active: true },
    { id: memberPriya.id, name: "Priya", team: "Sponsorship", role: "VOLUNTEER" as const, active: true },
    { id: memberSneha.id, name: "Sneha", team: "Design", role: "VOLUNTEER" as const, active: true },
    { id: memberKaran.id, name: "Karan", team: "Registration", role: "VOLUNTEER" as const, active: true },
    { id: memberIsha.id, name: "Isha", team: "Marketing", role: "VOLUNTEER" as const, active: true },
    { id: memberDev.id, name: "Dev", team: "Tech", role: "VOLUNTEER" as const, active: true },
    { id: memberMeera.id, name: "Meera", team: "Hospitality", role: "VOLUNTEER" as const, active: true },
  ];

  // Pre-seed the critical venue risk with cached explanation so demo never waits on LLM
  await prisma.risk.create({
    data: {
      eventId: event.id,
      fingerprint: `TASK_OVERDUE:${taskMap.get(1)}`,
      ruleKey: "TASK_OVERDUE",
      severity: "CRITICAL",
      status: "OPEN",
      title: 'Overdue task: "Confirm venue booking"',
      detail: "Task was due 3 days ago and is blocking stage layout and audio equipment setup.",
      entityType: "TASK",
      entityId: taskMap.get(1),
      evidence: {
        taskId: taskMap.get(1),
        title: "Confirm venue booking",
        priority: "CRITICAL",
        blockedCount: 2,
      },
      evidenceHash: "hash_venue_critical",
      aiExplanation: {
        headline: "Unconfirmed venue booking directly threatens entire setup schedule",
        impact: [
          'Blocks "Finalize stage & seating plan" (due in 4 days)',
          'Blocks "Set up AV & livestream equipment" (due in 8 days)',
          "Prevents campus facility gate pass approval for external vendors",
        ],
        recommendedActions: [
          "Follow up immediately with the college registrar office for signed copy",
          "Move deadline to Friday and reassign directly to Rahul",
          "Notify tech and logistics leads of revised setup window",
        ],
      },
      aiExplainedHash: "hash_venue_critical",
    },
  });

  // Seed Priya overload risk
  await prisma.risk.create({
    data: {
      eventId: event.id,
      fingerprint: `MEMBER_OVERLOADED:${memberPriya.id}`,
      ruleKey: "MEMBER_OVERLOADED",
      severity: "MEDIUM",
      status: "OPEN",
      title: "Volunteer overloaded: Priya",
      detail: "Priya is assigned to 6 open tasks across Sponsorship, Marketing, and Program.",
      entityType: "MEMBER",
      entityId: memberPriya.id,
      evidence: {
        memberId: memberPriya.id,
        openTasksCount: 6,
        threshold: 6,
      },
      evidenceHash: "hash_priya_overload",
    },
  });

  // Seed Unassigned High Priority task risk
  await prisma.risk.create({
    data: {
      eventId: event.id,
      fingerprint: `UNASSIGNED_HIGH_PRIORITY:${taskMap.get(8)}`,
      ruleKey: "UNASSIGNED_HIGH_PRIORITY",
      severity: "HIGH",
      status: "OPEN",
      title: 'Unassigned critical/high task: "Finalize volunteer shift roster"',
      detail: "High priority task in Registration currently has no assigned volunteer.",
      entityType: "TASK",
      entityId: taskMap.get(8),
      evidence: {
        taskId: taskMap.get(8),
        priority: "HIGH",
      },
      evidenceHash: "hash_roster_unassigned",
    },
  });

  // 10. Audit Log
  await prisma.auditLog.create({
    data: {
      eventId: event.id,
      actorUserId: userAman.id,
      via: "UI",
      action: "event.seeded",
      entityType: "EVENT",
      entityId: event.id,
      after: { name: event.name, tasksCount: 17 },
    },
  });

  console.log("Seeding completed successfully! TechNova 2026 is ready for the demo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

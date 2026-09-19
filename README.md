# ClubOps AI 🚀

> **From Chaos to Clarity with an Operating Agent**

ClubOps AI is an **AI-powered event operations platform** designed to
help college clubs and event organizers plan, coordinate, monitor, and
execute events from a single operational workspace.

Instead of forcing organizers to manage tasks across chats, meeting
notes, spreadsheets, and scattered reminders, ClubOps AI combines
**event planning, task management, volunteer workload tracking, meeting
intelligence, proactive risk detection, and an AI Copilot** into one
platform.

The central idea is simple:

> **The AI understands the current state of an event, identifies what
> needs attention, proposes operational actions, and lets a human
> organizer approve those actions before anything is changed.**

This project is being developed for **Bit N Build -- Around the World
2026 (PS-3)**.

------------------------------------------------------------------------

## ✨ Core Idea

Traditional event management often looks like:

``` text
WhatsApp / Chats
      +
Meeting Notes
      +
Spreadsheets
      +
Task Lists
      +
Manual Follow-ups
      ↓
Scattered Information
      ↓
Missed Deadlines / Overloaded Volunteers / Hidden Risks
```

ClubOps AI turns that into:

``` text
                    ┌─────────────────────┐
                    │     ClubOps AI      │
                    │ Event Operations    │
                    │       Platform      │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   Event & Task Data     Meeting Intelligence   Live Event State
          │                    │                    │
          └────────────────────┼────────────────────┘
                               ▼
                       ┌───────────────┐
                       │   AI Agent    │
                       └───────┬───────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
          Analyze / Explain          Propose Actions
                                             │
                                             ▼
                                  Human Organizer Review
                                             │
                              ┌──────────────┴──────────────┐
                              │                             │
                           Approve                       Reject
                              │                             │
                              ▼                             ▼
                     Backend Validation              Audit / Log
                              │
                              ▼
                         Execute Action
```

The AI is **not given direct database write access**. It proposes
structured actions, while the backend validates and executes only after
explicit human approval.

------------------------------------------------------------------------

# 🎯 Problem Statement

College clubs and student organizations often coordinate events using a
combination of:

-   WhatsApp or other chat platforms
-   Meeting notes
-   Spreadsheets
-   Manual task lists
-   Individual reminders
-   Separate volunteer lists
-   Last-minute follow-ups

This creates several operational problems:

-   Tasks get buried in conversations.
-   Meeting decisions do not automatically become trackable work.
-   Deadlines can be missed.
-   Volunteers can become overloaded.
-   Dependencies between tasks are difficult to monitor.
-   Important risks may only become visible when it is too late.
-   Organizers spend significant time manually checking the event's
    status.

ClubOps AI is designed to provide a **single operational command
center** for the event.

------------------------------------------------------------------------

# 💡 Solution

ClubOps AI provides an event-specific workspace containing:

### 📅 Event Management

Create and manage events with:

-   Event name
-   Description
-   Venue
-   Date and time
-   Expected audience
-   Event status

### ✅ Intelligent Task Management

Manage operational tasks with:

-   Categories
-   Priority
-   Deadlines
-   Assignees
-   Dependencies
-   Status tracking
-   AI-generated tasks

### 👥 Volunteer Management

Track:

-   Volunteer skills
-   Availability
-   Current workload
-   Maximum workload
-   Assignment status

The platform can recommend suitable volunteers based on **skill match
and workload**.

### 📝 Meeting Intelligence

Paste or upload meeting transcripts and let the AI extract:

-   Decisions
-   Action items
-   Owners
-   Deadlines
-   Priorities
-   Categories
-   Operational risks

Extracted information can be reviewed and edited before being applied to
the event.

### ⚠️ Proactive Risk Detection

A deterministic rule engine checks the operational state for conditions
such as:

-   Overdue tasks
-   Blocked dependencies
-   Volunteer overload
-   Unassigned critical tasks
-   Imminent event deadlines with significant pending work

### 🤖 AI Copilot

Organizers can interact with an AI Copilot using natural language.

Examples:

``` text
"What needs my attention?"

"Find major risks."

"Assign pending tasks."

"Summarize the latest meeting."

"Rahul is overloaded. Assign the pending registration task
to the best available volunteer."
```

The Copilot can inspect event state and propose actions.

### 🛡️ Human-in-the-Loop Execution

AI-generated mutations follow:

``` text
AI Analysis
     ↓
Action Proposal
     ↓
Human Review
     ↓
Approve / Edit / Reject
     ↓
Backend Validation
     ↓
Execution
     ↓
Audit Log + Notification
```

This prevents the AI from silently changing operational data.

------------------------------------------------------------------------

# 🧠 Key Design Principles

## 1. No Direct AI Database Writes

The LLM never receives direct MongoDB write permissions.

Instead:

``` text
LLM
 ↓
Structured JSON Action
 ↓
AIAction
 ↓
Human Approval
 ↓
Backend Validation
 ↓
Database Mutation
```

This is one of the core architectural principles of ClubOps AI.

## 2. No Guessing

If a volunteer cannot be verified against the event roster:

``` json
{
  "owner": "Unknown"
}
```

The system must not fabricate a person.

Similarly, ambiguous deadlines such as:

``` text
"soon"
"later"
"by evening"
```

are represented as:

``` json
{
  "deadline": "Unclear"
}
```

when they cannot be deterministically resolved.

## 3. Deterministic Risk Detection

Risk identification is primarily handled through backend rules rather
than asking an LLM to invent risks.

The system can then use an LLM to provide a natural-language explanation
and remediation recommendation.

``` text
Deterministic Rules
        ↓
Detected Risk
        ↓
LLM Explanation
        ↓
Recommended Action
```

## 4. Auditability

Every executed AI action is recorded through the activity log.

This creates a traceable history of:

-   What happened
-   Who requested it
-   What action was executed
-   What entity was affected
-   When it happened

------------------------------------------------------------------------

# 🏗️ Architecture

ClubOps AI follows a decoupled client-server architecture.

``` text
┌────────────────────────────────────────────┐
│             React SPA Dashboard            │
│       Tailwind CSS + Lucide + Context      │
└──────────────────────┬─────────────────────┘
                       │
                 HTTP / REST / JSON
                       │
                       ▼
┌────────────────────────────────────────────┐
│            Express.js API Gateway          │
│      Auth • Validation • RBAC • Router     │
└───────────────┬───────────────────┬────────┘
                │                   │
                ▼                   ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│      MongoDB            │  │      AI Agent Layer     │
│       + Mongoose        │  │  Gemini / OpenAI        │
│                         │  │  Structured JSON        │
│ Users, Events, Tasks,   │  │  Tool Calling           │
│ Volunteers, Risks,      │  │                         │
│ AI Actions, etc.        │  │                         │
└────────────┬────────────┘  └────────────┬────────────┘
             │                            │
             └──────────────┬─────────────┘
                            ▼
                ┌──────────────────────────┐
                │   HITL Execution Engine  │
                │                          │
                │ Validate → Preview       │
                │ Human Approve → Execute  │
                │ Audit → Notify           │
                └──────────────────────────┘
```

The operational loop is:

1.  **Ingest & Understand** --- event briefs, meeting transcripts, chat
    requests, and current event state are provided to the intelligence
    layer.
2.  **Analyze & Formulate** --- tasks, owners, deadlines, risks, or
    operational intents are identified.
3.  **Draft Action Proposal** --- AI-generated mutations are stored as
    `PROPOSED`.
4.  **Human Review** --- the organizer reviews an action preview.
5.  **Validated Execution** --- backend controllers validate
    authorization, IDs, business rules, dependencies, and workload
    constraints.
6.  **Telemetry & Update** --- activity logs, notifications, workload
    changes, and dashboard health are updated.

------------------------------------------------------------------------

# 🛠️ Technology Stack

## Frontend

  Technology              Purpose
  ----------------------- -----------------------------------------------
  React                   SPA frontend
  Vite                    Frontend build tooling
  React Router            Client-side routing
  Tailwind CSS            Styling and design system
  Lucide React            Icons
  Axios                   REST API communication
  Context API             Authentication, event, and notification state
  clsx / tailwind-merge   Conditional styling
  canvas-confetti         Approval success feedback

## Backend

  Technology   Purpose
  ------------ ----------------------------
  Node.js      Runtime
  Express.js   REST API
  Mongoose     MongoDB ODM
  JWT          Authentication
  bcryptjs     Password hashing
  Zod          Runtime validation
  Helmet       HTTP security
  CORS         Cross-origin configuration
  dotenv       Environment variables
  date-fns     Date/deadline handling

## AI

  Technology               Purpose
  ------------------------ -----------------------------------
  Google Gemini            Primary AI integration
  OpenAI SDK               Fallback AI provider
  Structured JSON Schema   Controlled AI outputs
  Tool Calling             Context-aware operational actions
  Zod                      Output validation

## Database

**MongoDB**

The system uses Mongoose models for:

-   Users
-   Events
-   Tasks
-   Volunteers
-   Meetings
-   Risks
-   Documents
-   Notifications
-   AI Actions
-   Activity Logs

------------------------------------------------------------------------

# 📁 Project Structure

``` text
ClubOps-Ai/
│
├── client/
│   ├── public/
│   │   ├── favicon.ico
│   │   └── mock_assets/
│   │
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosInstance.js
│   │   │   ├── authApi.js
│   │   │   ├── eventsApi.js
│   │   │   ├── tasksApi.js
│   │   │   ├── volunteersApi.js
│   │   │   ├── meetingsApi.js
│   │   │   ├── risksApi.js
│   │   │   ├── aiApi.js
│   │   │   └── notificationsApi.js
│   │   │
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── copilot/
│   │   │   ├── dashboard/
│   │   │   ├── events/
│   │   │   ├── tasks/
│   │   │   ├── meetings/
│   │   │   ├── risks/
│   │   │   └── volunteers/
│   │   │
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── ai/
│   │   ├── prompts/
│   │   ├── schemas/
│   │   └── tools/
│   ├── scripts/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── ClubOps-AI-Final-Master-Spec.md
├── plan.md
└── README.md
```

------------------------------------------------------------------------

# 🗄️ Database Design

## User

Stores organizer and volunteer account information.

Key fields:

``` text
name
email
password
role
phone
skills[]
availability
maxWorkload
```

Roles:

``` text
ORGANIZER
VOLUNTEER
```

## Event

Represents an event being managed.

``` text
name
description
venue
eventDate
startTime
endTime
status
expectedAudience
organizerId
```

Event statuses:

``` text
PLANNING
ONGOING
COMPLETED
CANCELLED
```

## Task

Represents an operational task.

``` text
eventId
title
description
category
priority
status
assignedTo
assignedVolunteerName
deadline
dependencies[]
source
createdBy
```

Categories include:

``` text
Venue
Registration
Sponsorship
Marketing
Technical
Hospitality
Finance
Logistics
Design
Documentation
```

Priorities:

``` text
LOW
MEDIUM
HIGH
CRITICAL
```

Statuses:

``` text
TODO
IN_PROGRESS
COMPLETED
BLOCKED
```

Task sources:

``` text
MANUAL
AI_PLANNER
MEETING_AI
AI_ACTION
```

## Volunteer

Tracks event-specific volunteer workload.

``` text
eventId
userId
name
email
skills[]
availability
currentWorkload
maximumWorkload
status
```

Volunteer statuses:

``` text
AVAILABLE
BUSY
OFFLINE
```

## Meeting

Stores meeting notes and AI extraction results.

``` text
eventId
title
date
participants[]
notes
transcript
analyzed
extractionResult
createdBy
```

Extraction results can contain:

-   Decisions
-   Action items
-   Owners
-   Deadlines
-   Priorities
-   Categories
-   Risks

## Risk

Represents an operational risk.

``` text
eventId
title
description
severity
source
relatedTaskId
recommendedAction
status
resolvedAt
```

Sources:

``` text
RULE_ENGINE
AI_ANALYSIS
MANUAL
```

## AIAction

Represents an AI-proposed or executed operation.

``` text
eventId
requestedBy
actionType
description
reason
parameters
status
executionResult
errorMessage
executedAt
```

Action states:

``` text
PROPOSED
APPROVED
REJECTED
EXECUTED
FAILED
```

## Notification

Used for operational notifications such as:

``` text
TASK_ASSIGNED
DEADLINE_ALERT
RISK_DETECTED
ACTION_EXECUTED
```

## ActivityLog

Provides the audit trail for event operations and AI actions.

------------------------------------------------------------------------

# 🔌 REST API

The backend exposes versioned APIs under:

``` text
/api/v1
```

## Authentication

  Method   Endpoint           Purpose
  -------- ------------------ -------------------
  POST     `/auth/register`   Create account
  POST     `/auth/login`      Authenticate user
  GET      `/auth/me`         Get current user

## Events

  Method   Endpoint               Purpose
  -------- ---------------------- ------------------
  GET      `/events`              List events
  POST     `/events`              Create event
  GET      `/events/:id`          Get event
  PUT      `/events/:id`          Update event
  GET      `/events/:id/health`   Get event health

Event health can include:

``` text
progressPercent
tasksCount
overdueCount
openRisksCount
volunteersCount
healthSummary
```

## Tasks

  Method   Endpoint                   Purpose
  -------- -------------------------- ------------------
  GET      `/events/:eventId/tasks`   List event tasks
  POST     `/events/:eventId/tasks`   Create task
  PUT      `/tasks/:id`               Update task
  PATCH    `/tasks/:id/status`        Change status
  POST     `/tasks/:id/assign`        Assign volunteer
  DELETE   `/tasks/:id`               Delete task

## Volunteers

  -----------------------------------------------------------------------------------------------
  Method                  Endpoint                                        Purpose
  ----------------------- ----------------------------------------------- -----------------------
  GET                     `/events/:eventId/volunteers`                   List volunteers

  POST                    `/events/:eventId/volunteers`                   Add volunteer

  GET                     `/events/:eventId/volunteers/recommendations`   Get recommendations
  -----------------------------------------------------------------------------------------------

## Meetings

  -----------------------------------------------------------------------------------------
  Method                  Endpoint                                  Purpose
  ----------------------- ----------------------------------------- -----------------------
  POST                    `/events/:eventId/meetings`               Save meeting

  GET                     `/events/:eventId/meetings`               List meetings

  POST                    `/events/:eventId/meetings/:id/analyze`   Analyze transcript

  POST                    `/events/:eventId/meetings/:id/apply`     Apply approved
                                                                    extraction
  -----------------------------------------------------------------------------------------

## Risks

  Method   Endpoint                               Purpose
  -------- -------------------------------------- ---------------------
  GET      `/events/:eventId/risks`               List risks
  POST     `/events/:eventId/risks/evaluate`      Evaluate risk rules
  PATCH    `/events/:eventId/risks/:id/resolve`   Resolve risk

## AI

  Method   Endpoint                         Purpose
  -------- -------------------------------- -------------------------------
  POST     `/ai/event-plan`                 Generate event plan
  POST     `/ai/chat`                       Interact with AI Copilot
  POST     `/ai/action/approve`             Approve and execute AI action
  POST     `/ai/action/reject`              Reject AI action
  GET      `/ai/actions/pending/:eventId`   Get pending proposals
  GET      `/ai/summary/:eventId`           Generate executive briefing

------------------------------------------------------------------------

# 🤖 AI Subsystem

ClubOps AI uses AI for **understanding, planning, explaining, and
proposing** rather than unrestricted database mutation.

## AI Event Planner

The event planner generates approximately **15--25 realistic operational
tasks** across categories such as:

-   Venue
-   Registration
-   Sponsorship
-   Marketing
-   Technical
-   Hospitality
-   Finance
-   Logistics
-   Design
-   Documentation

Generated tasks can include:

-   Priority
-   Duration
-   Deadline
-   Dependencies

The organizer can review the generated plan before applying it.

------------------------------------------------------------------------

# 📝 Meeting Transcript Intelligence

A meeting transcript can be converted into structured operational
information.

Example:

``` text
Rahul: I will confirm the main auditorium acoustics
and seating by tomorrow evening.

Amit: The sponsor hasn't sent high-res logos yet.
This might delay printing.
```

The intelligence layer can identify:

``` text
Action Item:
Confirm auditorium acoustics and seating

Owner:
Rahul

Risk:
Sponsor logo delay may delay banner printing
```

The extracted results are displayed for organizer review before being
applied to the event.

------------------------------------------------------------------------

# 🧰 AI Tool Calling

The Copilot has access to controlled tools rather than unrestricted
database access.

Available operational tools include:

``` text
getEventStatus(eventId)
getPendingTasks(eventId, category?)
getVolunteers(eventId)
getRisks(eventId, severity?)

proposeCreateTask(...)
proposeAssignTask(...)
proposeCreateRisk(...)
proposeSendNotification(...)
```

The distinction is important:

``` text
Inspection tools
      ↓
Read current event state

Proposal tools
      ↓
Create an AIAction proposal

Execution engine
      ↓
Validate + execute only after approval
```

------------------------------------------------------------------------

# ⚠️ Deterministic Risk Engine

ClubOps AI uses deterministic backend rules for core risk detection.

## RULE-01 --- Overdue Task

If:

``` text
deadline < now
AND
status != COMPLETED
```

the task becomes a high-severity operational concern.

Severity can become critical when the task has high/critical priority or
the event is very close.

## RULE-02 --- Dependency Blocked

If:

``` text
Task dependency is incomplete
AND
deadline is within 48 hours
```

the task is flagged as a high-severity risk.

## RULE-03 --- Volunteer Overload

If:

``` text
currentWorkload >= maximumWorkload
```

the volunteer is flagged as being at capacity.

## RULE-04 --- Unassigned Critical Task

If:

``` text
priority == CRITICAL
AND
assignedTo == null
```

the system creates a critical risk.

## RULE-05 --- Approaching Event Deadline

If:

``` text
event is <= 3 days away
AND
more than 40% of tasks are still TODO
```

the system identifies an imminent workload risk.

------------------------------------------------------------------------

# 🛡️ Human-in-the-Loop Action Engine

Every AI mutation follows a state machine:

``` text
                ┌──────────────┐
                │   PROPOSED   │
                └──────┬───────┘
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
       ┌───────────┐       ┌──────────┐
       │ APPROVED  │       │ REJECTED │
       └─────┬─────┘       └──────────┘
             │
             ▼
      Backend Validation
             │
       ┌─────┴─────┐
       │           │
       ▼           ▼
  ┌──────────┐  ┌────────┐
  │ EXECUTED │  │ FAILED │
  └────┬─────┘  └────────┘
       │
       ▼
 Activity Log
       +
 Notification
       +
 Dashboard Refresh
```

Before execution, the backend validates:

1.  Event exists and is active.
2.  Task and volunteer IDs are valid.
3.  User is authorized.
4.  Workload limits are respected.
5.  Business rules are satisfied.

------------------------------------------------------------------------

# 🖥️ Frontend Experience

## Event Health Dashboard

The main dashboard is designed to show the current operational state at
a glance.

It includes:

-   Event title and date
-   Days remaining
-   Event status
-   Overall health/progress
-   Task statistics
-   Volunteer count
-   Active risks
-   Tasks due today
-   Volunteer workload
-   AI executive summary
-   Activity timeline
-   Critical risk alerts

## AI Copilot

A floating Copilot drawer is accessible throughout the application.

Quick prompts include:

``` text
What needs my attention?
Find major risks
Assign pending tasks
Summarize latest meeting
```

The Copilot is context-aware and can use the currently selected event.

## Meeting Intelligence Hub

The meeting interface provides:

``` text
┌──────────────────────┬─────────────────────────┐
│ Original Transcript  │ Extracted Intelligence  │
│                      │                         │
│ Raw meeting text     │ Action Items            │
│                      │ Owners                  │
│                      │ Deadlines               │
│                      │ Risks                   │
└──────────────────────┴─────────────────────────┘
```

Organizers can edit extracted information before applying it.

## Tasks Board

Tasks can be viewed through:

-   Kanban board
-   Detailed table

Supported states:

``` text
TODO
IN_PROGRESS
COMPLETED
BLOCKED
```

Tasks can be filtered by:

-   Category
-   Priority
-   Assignee

Dependency indicators show when a task is blocked by another task.

------------------------------------------------------------------------

# 🎨 UI / UX Direction

The planned interface follows a modern dark operations-dashboard
aesthetic.

### Design Characteristics

-   Dark slate foundation
-   Glassmorphism
-   Rounded operational cards
-   Clear status indicators
-   AI-focused visual accents
-   Responsive layouts
-   Clear hierarchy for critical risks

The specification defines:

``` text
Primary Accent:
Indigo / Violet

Success:
Emerald

Warning:
Amber

Critical:
Rose

AI / Information:
Sky
```

The overall goal is to make the interface feel like an **operations
command center** rather than a generic CRUD dashboard.

------------------------------------------------------------------------

# 🧪 Demo Scenario

The curated demonstration event is:

## National Tech Summit 2026

``` text
Venue:
Main Auditorium & Hall B

Expected Audience:
500 attendees

Event:
National Tech Summit 2026
```

The demo dataset includes five volunteers with different skills and
workloads.

  Volunteer      Skills                                        Max   Initial
  -------------- ------------------------------------------- ----- ---------
  Rahul Sharma   Registration, Communication, PR                 5         2
  Priya Patel    Technical, Audio/Visual, Stage Management       5         3
  Amit Verma     Design, Marketing, Social Media                 5         4
  Neha Singh     Logistics, Hospitality, Catering                5         1
  Karan Joshi    Sponsorship, Finance, Documentation             4         0

------------------------------------------------------------------------

# 🎬 Golden Demo Flow

The planned hackathon presentation follows a **4-minute story arc: "From
Chaos to Clarity with an Operating Agent."**

## 1. Dashboard --- 0:00 to 0:30

Show the event:

``` text
National Tech Summit 2026
```

Explain the problem:

-   Scattered conversations
-   Lost meeting notes
-   Manual task management
-   Volunteer overload

## 2. AI Event Planner --- 0:30 to 1:15

Generate the event plan.

The AI produces a structured set of categorized operational tasks.

The organizer reviews and applies the plan.

## 3. Meeting Intelligence --- 1:15 to 2:00

Paste the curated meeting transcript.

The AI identifies:

-   Assigned action items
-   Exact volunteer matches
-   Ambiguous ownership
-   Speaker confirmation risk
-   Potential operational delays

The organizer reviews the extraction and applies approved items.

## 4. Proactive Risk Detection --- 2:00 to 2:45

The dashboard reflects newly detected risks.

A high-severity issue such as pending speaker confirmation becomes
visible.

The organizer can inspect the risk and view its operational impact.

## 5. AI Copilot --- 2:45 to 3:30

Example request:

``` text
Rahul is overloaded. Assign the pending registration
task to the best available volunteer.
```

The AI evaluates current workload and skills.

It generates an action preview.

The organizer sees:

``` text
Action Type
Target Task
Proposed Assignee
Current Capacity
Skills
Reason
```

The organizer chooses:

``` text
[ Approve & Execute ]
```

The system then:

-   Reassigns the task
-   Updates workload
-   Creates notification
-   Adds an activity log
-   Refreshes the dashboard

## 6. Closing --- 3:30 to 4:00

The core product message:

> **ClubOps AI does not just chat. It understands event state,
> anticipates risks, and operates the platform with human approval.**

------------------------------------------------------------------------

# 🔄 Offline / Fallback Intelligence

Hackathon demonstrations should not fail because an external AI API
becomes temporarily unavailable.

ClubOps AI therefore defines a fallback mechanism for AI extraction.

If the AI provider encounters:

-   Network failure
-   Timeout
-   API quota exhaustion
-   HTTP 429 rate limiting

the system can use cached demo intelligence matching the curated
transcript.

The UI can indicate:

``` text
Offline Mode Active: Using Cached Intelligence Model
```

This allows the core demonstration flow to continue even when external
AI services are unavailable.

------------------------------------------------------------------------

# 🔐 Security & Reliability

The platform is designed with several safeguards:

### Authentication

JWT-based authentication is used for protected API access.

### Password Security

Passwords are hashed using `bcryptjs`.

### Authorization

Backend authorization checks determine whether a user is permitted to
perform protected operations.

### Input Validation

Zod is used to validate:

-   API inputs
-   Structured AI outputs

### HTTP Security

Helmet is included for HTTP security hardening.

### AI Safety

The AI:

-   Cannot directly write to MongoDB.
-   Cannot invent volunteer identities.
-   Must use structured outputs.
-   Must represent ambiguous information as unknown/unclear.
-   Can only propose supported operations.

------------------------------------------------------------------------

# ⚙️ Local Development

> The following setup reflects the project implementation plan. Adjust
> commands if the repository implementation differs.

## Prerequisites

Install:

-   Node.js 18+ or 20+ LTS
-   npm
-   MongoDB Community or MongoDB Atlas
-   A Gemini API key
-   Optional OpenAI API key for fallback

------------------------------------------------------------------------

## 1. Clone the Repository

``` bash
git clone <YOUR_REPOSITORY_URL>
cd ClubOps-Ai
```

------------------------------------------------------------------------

## 2. Backend Setup

``` bash
cd server
npm install
```

Create:

``` text
.env
```

based on:

``` text
.env.example
```

Example:

``` env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_gemini_api_key

OPENAI_API_KEY=your_openai_api_key
```

Start the backend:

``` bash
npm run dev
```

------------------------------------------------------------------------

## 3. Frontend Setup

Open another terminal:

``` bash
cd client
npm install
```

Start the frontend:

``` bash
npm run dev
```

The frontend communicates with the backend through the configured API
base URL.

------------------------------------------------------------------------

# 🌱 Seed Data

The project plan includes a seed script for quickly creating a demo
environment containing:

-   1 organizer
-   5 volunteers
-   1 event
-   Sample operational tasks

Run the seed script according to the project's server scripts
configuration.

------------------------------------------------------------------------

# 🧪 Testing Strategy

ClubOps AI includes both functional and AI safety verification.

Important scenarios include:

  Test                              Expected Behavior
  --------------------------------- ----------------------------------------
  Duplicate registration            Request rejected
  Invalid volunteer assignment      Assignment rejected
  Incomplete dependency             Task remains blocked
  Unknown volunteer in transcript   Owner becomes `Unknown`
  Ambiguous deadline                Deadline becomes `Unclear`
  AI action without approval        No database mutation
  Approved assignment               Task + workload + notification updated
  Overdue task                      Risk generated
  Unsupported AI request            Action rejected
  AI API unavailable                Cached fallback can be used

------------------------------------------------------------------------

# 🧩 Example AI Safety Cases

### Unknown Volunteer

User:

``` text
Assign sponsorship to Michael.
```

If Michael is not part of the event roster, the system must not invent a
user.

The Copilot can instead explain that Michael was not found and suggest
registered volunteers with relevant skills.

### Unsupported Action

User:

``` text
Delete the entire database.
```

The action engine rejects the request because database-wide destructive
operations are outside the supported operational tool catalog.

### Ambiguous Deadline

Input:

``` text
Finish the banners soon.
```

The system should not randomly assign a date.

Instead:

``` json
{
  "deadline": "Unclear"
}
```

------------------------------------------------------------------------

# 📊 Event Health

The event health endpoint is designed to combine operational indicators
such as:

``` text
Task completion
Overdue tasks
Open risks
Volunteer count
Volunteer workload
Event proximity
```

This allows the dashboard to provide an operational snapshot instead of
forcing the organizer to inspect every module individually.

------------------------------------------------------------------------

# 🚀 Planned Implementation Phases

The project implementation roadmap is organized into ten phases:

``` text
Phase 0
Workspace & Environment Setup

Phase 1
Backend Scaffolding & Database Models

Phase 2
Core Operational REST APIs

Phase 3
Frontend Foundation & Design System

Phase 4
Operational UI Modules

Phase 5
AI Engine v1
Event Planner + Meeting Intelligence

Phase 6
Deterministic Risk Engine + Health Analytics

Phase 7
AI Copilot + Human-in-the-Loop Action Engine

Phase 8
Seed Data + Fallback Cache + Demo Polishing

Phase 9
End-to-End Verification + Dry Run
```

------------------------------------------------------------------------

# 🗺️ Future Expansion

The architecture is intentionally modular so that additional operational
capabilities can be introduced later.

Potential extensions include:

-   More event types
-   Additional operational tools
-   Richer document intelligence
-   Calendar integrations
-   Communication integrations
-   More advanced workload balancing
-   More sophisticated event-health analytics
-   Additional AI providers
-   Role-specific dashboards
-   Historical event analytics

These are possible extensions rather than requirements of the current
hackathon implementation plan.

------------------------------------------------------------------------

# 🏆 Why ClubOps AI?

ClubOps AI is not designed as another generic chatbot layered over an
event-management CRUD application.

Its architecture focuses on the operational loop:

``` text
UNDERSTAND
    ↓
ANALYZE
    ↓
DETECT
    ↓
PROPOSE
    ↓
REVIEW
    ↓
APPROVE
    ↓
EXECUTE
    ↓
AUDIT
```

The key distinction is the combination of:

-   **Event state awareness**
-   **Structured AI outputs**
-   **Deterministic risk detection**
-   **Controlled tool calling**
-   **Human approval**
-   **Validated backend execution**
-   **Auditability**

This allows AI to participate in event operations without making
uncontrolled changes to the system.

------------------------------------------------------------------------

# 📌 Non-Negotiable Rules

ClubOps AI follows five core rules:

### 1. No Direct AI Writes

> The LLM proposes. The human approves. The backend executes.

### 2. No Guessing

Unknown owners remain:

``` text
Unknown
```

Ambiguous dates remain:

``` text
Unclear
```

### 3. Workload Limits Matter

Overloaded volunteers must be detected by the operational rules.

### 4. Every Executed Action Is Auditable

Every executed AI action must have a corresponding activity-log entry.

### 5. Controlled Operations Only

The Copilot can only perform actions exposed through the approved tool
catalog.

------------------------------------------------------------------------

# 📜 Project Status

This repository is based on the **ClubOps AI Comprehensive Master
Implementation Plan** and its architectural specification.

The specification defines the architecture, database design, REST API
contract, AI subsystem, risk engine, HITL action lifecycle, UI
structure, curated demo data, testing strategy, and hackathon
demonstration flow.

> **Implementation status should be updated here as development
> progresses.**

Suggested status format:

``` text
🚧 Status: In Development
```

------------------------------------------------------------------------

# 👨‍💻 Team

Add the project contributors here:

``` text
- Name — Role
- Name — Role
- Name — Role
- Name — Role
```

------------------------------------------------------------------------

# 📸 Screenshots / Demo

Add screenshots here once the UI is ready.

Recommended sections:

``` text
## Dashboard

![Event Dashboard](./docs/screenshots/dashboard.png)

## AI Copilot

![AI Copilot](./docs/screenshots/copilot.png)

## Meeting Intelligence

![Meeting Intelligence](./docs/screenshots/meeting-intelligence.png)

## Risk Detection

![Risk Detection](./docs/screenshots/risk-detection.png)

## Human-in-the-Loop Action

![Action Preview](./docs/screenshots/action-preview.png)
```

For the final hackathon submission, consider adding:

-   Demo video
-   Architecture diagram
-   Short product walkthrough
-   Deployment link
-   Presentation/demo link

------------------------------------------------------------------------

# 📚 Documentation

The repository can contain the following supporting documents:

``` text
README.md
    ↓
High-level project documentation

ClubOps-AI-Final-Master-Spec.md
    ↓
Detailed product and technical specification

plan.md
    ↓
Implementation roadmap and engineering blueprint
```

------------------------------------------------------------------------

# 📄 License

Add the project's selected license here.

Example:

``` text
MIT License
```

------------------------------------------------------------------------

## ⭐ Final Product Vision

ClubOps AI aims to turn event management from a collection of
disconnected tasks and conversations into a **state-aware operational
system**.

The organizer remains in control.

The AI provides intelligence.

The backend enforces correctness.

And every important action remains visible and auditable.

``` text
                 CLUBOPS AI

       ┌───────────────────────────┐
       │      Event State           │
       └─────────────┬─────────────┘
                     ↓
       ┌───────────────────────────┐
       │     AI Understanding      │
       └─────────────┬─────────────┘
                     ↓
       ┌───────────────────────────┐
       │  Risks + Recommendations   │
       └─────────────┬─────────────┘
                     ↓
       ┌───────────────────────────┐
       │     Human Approval        │
       └─────────────┬─────────────┘
                     ↓
       ┌───────────────────────────┐
       │   Validated Execution     │
       └─────────────┬─────────────┘
                     ↓
       ┌───────────────────────────┐
       │   Audit + Notifications   │
       └───────────────────────────┘
```

> **ClubOps AI --- From Chaos to Clarity with an Operating Agent.**

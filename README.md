# ClubOps AI — Operations Command Center for College Clubs

> **Event:** Bit N Build — Around the World 2026 (24-hour final)  
> **Problem Statement:** PS-3 — ClubOps AI  
> **Architecture:** Next.js (App Router) + TypeScript + Tailwind CSS + Prisma ORM + MongoDB Atlas + Gemini 2.5 AI

---

## 1. Problem & Solution

### The Problem
College clubs running major technical hackathons, cultural festivals, and symposia struggle with fragmented coordination:
- Planning lives across chaotic WhatsApp chats and outdated spreadsheets.
- Meeting decisions and action items are lost without clear owners or deadlines.
- Bottlenecks (like venue agreement delays or overloaded volunteers) surface only when it's too late to recover.
- Documents and venue guidelines sit in PDFs that nobody reads until a violation occurs.

### The Solution: ClubOps AI
ClubOps AI is an **AI-assisted operations command center** that manages events with operational rigor:
1. **AI Event Strategist:** Generates complete operational plans with teams, tasks, and dependency graph.
2. **Meeting Auditor:** Extracts action items from transcripts with verbatim evidence quotes and fuzzy owner matching.
3. **Deterministic Risk Engine:** A pure, rule-based engine evaluating 9 operational failure modes (overdue tasks, blocked dependencies, member overload) paired with causal AI impact explanations.
4. **Knowledge Repository (RAG):** Answers operational queries from contracts/agreements with verified `[1]`, `[2]` citations.
5. **Agent with Human Confirmation:** AI proposes actions (`PendingAction`), the server builds verified summaries from DB facts, and human organizers click to confirm before any consequential mutation executes.

---

## 2. Tech Stack Disclosure

| Area | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) | Monolith combining server components, API handlers, and UI |
| **Language** | TypeScript | Strict type-safety across requests, DB, and LLM schemas |
| **Styling** | Tailwind CSS + Lucide Icons | Command-center dark theme with glassmorphism & status pills |
| **Database** | MongoDB Atlas + Prisma ORM | Scalable document store with ObjectID relations, indexes, and vector embeddings |
| **Authentication** | `bcryptjs` + Signed JWT (`jose`) | HttpOnly session cookie with role guards (Organizer vs Volunteer) |
| **AI Layer** | `@google/genai` (Gemini 2.5 Flash & text-embedding-004) | Structured JSON output, multi-turn tool calling, embeddings |
| **Document Ingestion** | `unpdf` (PDF) & `mammoth` (DOCX) | Serverless text extraction and paragraph/sentence chunking |
| **Testing** | Vitest | Unit test suites for the risk engine and transcript extraction |

---

## 3. Quick Start & Setup

### Prerequisites
- Node.js v20+ or v24+
- MongoDB Atlas cluster (or local MongoDB with replica set)

### 1. Installation
```bash
git clone <repo-url>
cd clubops-ai
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill your MongoDB Atlas connection string and Gemini API key:
```bash
cp .env.example .env
```
Key variables:
- `DATABASE_URL`: MongoDB Atlas connection string (`mongodb+srv://<user>:<password>@cluster.mongodb.net/clubops_ai?retryWrites=true&w=majority`)
- `GEMINI_API_KEY`: Google Gemini API key
- `AI_MODEL`: `gemini-3.6-flash`
- `EMBEDDING_MODEL`: `text-embedding-004`
- `APP_TIMEZONE`: `Asia/Kolkata`
- `DEMO_MODE`: `true`

### 3. Initialize Database & Seed TechNova 2026
```bash
# Push Prisma schema to your database
npx prisma db push

# Seed realistic relative-dated event (TechNova 2026)
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Demo Accounts & Guided Walkthrough

| Account | Email | Password | Role | Permissions |
|---|---|---|---|---|
| **Lead Organizer** | `organizer@clubops.demo` | `demo1234` | `ORGANIZER` | Full control: AI assistant, meetings review, risks, documents, approvals |
| **Volunteer** | `rahul@clubops.demo` | `demo1234` | `VOLUNTEER` | Restricted: My Tasks status updates and broadcast announcements only |

*(Both accounts are accessible via 1-click fast login buttons on the login screen).*

---

## 5. 7-Scene Demo Script

### Scene 1: Event Workspace Creation
1. Log in as **Aman** (`organizer@clubops.demo`).
2. Click **Create Event** and select the preset for **"Bit N Build 2026"** (500 participants, starts in 14 days).
3. Enter the newly launched, clean operational workspace.

### Scene 2: AI Strategic Event Plan
1. On the empty dashboard, click **"Scene 2: Propose AI Plan & Tasks"** or ask the AI Assistant: *"Create an initial operational plan."*
2. Inspect the proposed teams, deliverables, and dependency links.
3. Confirm to deploy real tasks with the **AI** badge.

### Scene 3: Meeting Note Processing & Review
1. Switch to the seeded event **"TechNova 2026"** (*"an event two weeks into planning"*).
2. Navigate to **Meetings** -> **Process Meeting**.
3. Click **"Paste Appendix A.1"** to load the realistic sync transcript.
4. Click **Save & Extract Items**.
5. Observe the **Meeting Review Screen**:
   - 5 action items extracted with confidence ratings and verbatim evidence quotes.
   - 4 owners resolved (Rahul, Priya, Sneha, Karan).
   - 1 unassigned item honestly flagged: *"Nobody has the bandwidth to own it right now"*.
   - Scheduling remark (*"Let's meet again on Thursday"*) correctly ignored.
6. Click **Create 5 Tasks** to convert them into live deliverables with the **Meeting** badge.

### Scene 4: Deterministic Risk Engine & AI Explanations
1. Return to the **Dashboard** or **Risks** page.
2. View the **CRITICAL** risk: *"Confirm venue booking"* (overdue by 3 days, CRITICAL priority, blocks stage & AV equipment).
3. Click **Explain with AI**:
   - Generates causal impact grounded strictly in the data.
   - Provides 4 concrete organizer actions.

### Scene 5: Grounded Document RAG with Citations
1. Open the **AI Assistant Drawer** (or press `⌘K` / `Ctrl+K`).
2. Ask: *"What does the venue agreement say about capacity?"*
3. The assistant retrieves `Venue_Usage_Agreement_Main_Auditorium.txt`, cites clause 4.1 (`450 seated, no standing`), and cross-references that the event expects 500 participants.

### Scene 6: Controlled Agent Action with Staged Confirmation
1. In the AI Assistant, type:
   > *"Move the venue confirmation deadline to Friday and assign it to Rahul."*
2. The agent stages a `PendingAction` and displays a server-built confirmation card:
   > `Change deadline of "Confirm venue booking": Tue 16 Sep → Fri 25 Sep 2026`  
   > `Reassign "Confirm venue booking": Aman → Rahul`
3. Click **Confirm & Execute**.
4. Check the Live Audit Trail on the dashboard: shows mutation recorded **"via AI"**.

### Scene 7: Event Health & Focus Priorities
1. Click **"Synthesize AI Health Insights"** on the dashboard.
2. Receive a prioritized, data-backed operational focus list.
3. Switch login to **Rahul** (`rahul@clubops.demo`) to show volunteer role boundaries: Rahul sees only his tasks and announcements without administrative access.

---

## 6. Architecture & Safety Model

```text
Browser (Next.js UI & Components)
   │  fetch / Server Actions
   ▼
Route Handlers (/api/...) ── authenticate ▸ Zod validation ▸ build Ctx (user, member, event, role)
   │
   ├──────────────► Services (authorization · business rules · audit log) ──► Prisma ──► PostgreSQL
   │                    ▲
   │                    │  The ONLY way data changes
   └──► AI Layer ───────┘
          ├─ llm.ts        Provider wrapper: JSON output, tool calling, embeddings
          ├─ workflows/    Plan · Meeting · Risk Explanation · Health · Announcement
          ├─ agent/        Turn loop · Tool registry · Pending actions (staged confirmation)
          └─ rag/          Extract (PDF/DOCX/TXT) · Chunk · Embed · Cosine retrieval
```

### Safety Guarantees
- **No Direct DB Access for LLM:** AI tools call backend **services**, never raw Prisma handles.
- **Human in the Loop:** Consequential write tools stage a `PendingAction`. The server builds the human-readable summary from database facts; the human organizer clicks confirm.
- **Untrusted Input Protection:** Document text and meeting transcripts are wrapped in `<untrusted_source>` tags; prompt injections (e.g. `seed-data/injection-test.txt`) cannot trigger deletions because no delete tool is registered.
- **Deterministic Risk Truth:** Risks are computed by pure TypeScript math, eliminating hallucinated risk states.

---

## 7. Verification & Testing

Run the automated Vitest test suite:
```bash
# Run all unit tests
npm run test

# Run deterministic risk engine test suite
npm run test:risk
```
Build verification:
```bash
npm run build
```

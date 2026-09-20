# ClubOps AI

### Intelligent Event Operations Copilot with Strict Human-in-the-Loop Execution

> **AI assists. Humans decide. Operations stay reliable.**

ClubOps AI is a full-stack AI-powered event operations platform for **collegiate clubs, student societies, hackathons, and event committees**.

It converts scattered event information from meetings, documents, and operational data into **structured tasks, risk alerts, and actionable recommendations** while keeping humans in control of every important system change.

---

## 🚨 Problem

Event teams often manage operations across chats, spreadsheets, documents, and meeting notes, leading to:

* Fragmented information
* Missed deadlines and dependencies
* Volunteer overload
* Late discovery of operational risks
* Unsafe or uncontrolled AI automation

---

## 💡 Solution

ClubOps AI creates a centralized operational command center where AI can **understand, analyze, and recommend**, but cannot directly modify critical system state.

```text
Event Data / Meetings / Documents
              ↓
       AI Intelligence
              ↓
      Proposed Action
              ↓
      👤 Human Approval
              ↓
     Backend Validation
              ↓
        MongoDB State
              ↓
        Activity Log
```

---

## ✨ Key Features

### 🤖 AI Event Planner

Generates structured event tasks, workstreams, priorities, and dependencies from high-level event information.

### 📝 Meeting Intelligence

Extracts action items, owners, deadlines, decisions, and risks from meeting notes and transcripts.

### ⚠️ Deterministic Risk Engine

Uses rule-based logic to detect operational issues such as:

* Overdue tasks
* Blocked dependencies
* Volunteer overload
* Unassigned critical tasks
* Imminent event risks

### 📄 Grounded Document Intelligence

Uses event-related documents such as PDFs, DOCX, and TXT files to provide context-aware operational answers.

### 👤 Human-in-the-Loop Action Engine

AI actions are staged as proposals instead of directly modifying the database.

```text
PROPOSED
   ↓
Human Review
   ↓
APPROVED / REJECTED
   ↓
Backend Validation
   ↓
EXECUTED / FAILED
```

### 🔐 Role-Based Access Control

Separate operational permissions for **Organizers** and **Volunteers**.

### 📊 Volunteer Workload Tracking

Tracks workload and capacity to help prevent over-assignment and identify available alternatives.

### 📋 Audit Trail

Operational actions and important state changes are recorded through an activity log.

---

## 🏗️ Architecture

```text
┌───────────────────────┐
│    React Dashboard    │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│ Express API + Zod     │
│ Auth • RBAC • Routes  │
└───────┬─────────┬─────┘
        ↓         ↓
┌────────────┐  ┌────────────────┐
│  MongoDB   │  │  Gemini AI     │
│ + Mongoose │  │ Bounded Tools  │
└────────────┘  └───────┬────────┘
                         ↓
                 ┌───────────────┐
                 │ Human Approval│
                 └───────┬───────┘
                         ↓
                 ┌───────────────┐
                 │ Backend       │
                 │ Execution     │
                 └───────┬───────┘
                         ↓
                 ┌───────────────┐
                 │ Activity Log  │
                 └───────────────┘
```

### Core Principle

> **The AI can recommend an action. Only an authorized, human-approved backend path can change operational state.**

---

## 🛡️ Safety & Guardrails

ClubOps AI is designed with strict boundaries around AI execution:

| Risk                 | Protection                        |
| -------------------- | --------------------------------- |
| Hallucinated IDs     | Unknown entities remain `Unknown` |
| Ambiguous deadlines  | Preserved as `Unclear`            |
| Invalid AI output    | Zod schema validation             |
| Volunteer overload   | Capacity checks                   |
| Unauthorized actions | RBAC + backend validation         |
| Direct AI mutations  | No unrestricted DB write access   |
| Untraceable changes  | Activity logging                  |

---

## 🛠️ Tech Stack

**Frontend**

* React
* Vite
* Tailwind CSS
* Axios
* Lucide React

**Backend**

* Node.js
* Express.js
* Zod
* JWT
* bcryptjs
* Helmet

**Database**

* MongoDB
* Mongoose

**AI**

* Google Gemini SDK
* Structured outputs
* Tool calling

**Development**

* Git
* VS Code
* Postman
* npm

---

## 📁 Project Structure

```text
ClubOps-Ai/
│
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── api/
│       ├── context/
│       └── hooks/
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── ai/
│
├── README.md
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js 20+
* npm
* MongoDB / MongoDB Atlas
* Google Gemini API key

### Installation

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ClubOps-Ai
```

Install dependencies:

```bash
cd server
npm install

cd ../client
npm install
```

Create your server environment variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

> **Never commit API keys, database credentials, or `.env` files to GitHub.**

---

## 🔮 Future Scope

* WhatsApp & Slack integrations
* QR-based volunteer check-in
* Multi-event analytics
* Advanced operational forecasting
* Additional notification channels
* Expanded document integrations

---

## 👥 Team ClubOps

| Area             | Contribution                                |
| ---------------- | ------------------------------------------- |
| Backend & APIs   | REST APIs, authentication, validation       |
| Frontend & UI/UX | React dashboard, Kanban, Copilot interface  |
| AI Agent Engine  | Gemini integration, prompting, tool calling |
| Risk Engine & QA | Risk rules, database, testing               |

> Replace the contribution labels with your **actual team member names** before publishing.

---

## 🏆 Hackathon

**Bit N Build – Around the World 2026**
**Problem Statement:** PS-3
**Domain:** AI Agentic Workflows & Operations

---

## ClubOps AI

> **AI assists. Humans decide. Systems stay safe and accountable.**

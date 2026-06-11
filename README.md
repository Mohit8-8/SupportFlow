# SupportFlow

SupportFlow is a full-stack AI-assisted support ticketing workspace built with a React + Vite frontend, an Express + TypeScript backend, PostgreSQL, Prisma, and JWT-based authentication. It is designed around a simple but practical support flow: customers submit issues, the system automatically triages them with AI, and support agents review, prioritize, assign, and resolve the resulting queue while keeping the conversation threaded in comments.

## What This Project Does

SupportFlow provides two coordinated experiences:

* A customer-facing workspace for creating tickets, reviewing ticket history, and continuing conversations inside each ticket thread.
* An agent-facing triage console for browsing the support queue, filtering and searching requests, updating status, assigning ownership, and reading AI-generated guidance for each case.

The backend persists users, tickets, and comments in PostgreSQL through Prisma. Authentication is handled with hashed passwords and signed JWTs, and the AI triage flow uses Gemini when configured, with safe fallback values when it is not.

## Key Features

* Email and password authentication with registration and login.
* Role-based user types: `CUSTOMER` and `AGENT`.
* JWT-protected API routes with token-based session persistence on the frontend.
* Customer ticket creation with title and description capture.
* AI-assisted ticket analysis that generates:
	* a ticket category,
	* a priority level,
	* a suggested response draft.
* Customer ticket history with expandable conversation threads.
* Agent support queue with:
	* pagination,
	* keyword search,
	* status filtering,
	* priority filtering,
	* assignment actions,
	* status updates.
* Threaded comments on each ticket for back-and-forth collaboration.
* PostgreSQL-backed persistence using Prisma models and migrations.
* Backend health check endpoint for service verification.

## Roles And Workflow

### Customer

Customers can register, sign in, create support tickets, and follow the progress of their own requests. In the UI, customers see only their own ticket history and can open a ticket to add comments to the conversation thread.

### Agent

Agents sign in to a global triage dashboard where they can review the full queue, inspect ticket details, view AI-generated classification data, assign a ticket to themselves, move a ticket through the workflow, and participate in the ticket thread.

### System AI Triage

When a customer submits a ticket, the backend sends the title and description to the AI service. The model returns a structured JSON payload with category, priority, and suggested response. If the AI key is missing or the request fails, the backend falls back to safe defaults so ticket creation still succeeds.

## Tech Stack

### Backend

* Express 5
* TypeScript
* Prisma ORM
* PostgreSQL
* JWT authentication
* bcryptjs for password hashing
* CORS and JSON request handling
* Gemini API integration for ticket triage

### Frontend

* React 19
* Vite
* TypeScript
* Tailwind CSS v4
* shadcn/ui primitives
* Radix UI
* Geist Variable font
* lucide-react icons

## Project Structure

```text
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── comment.controller.ts
│   │   │   └── ticket.controller.ts
│   │   ├── lib/
│   │   │   └── db.ts
│   │   ├── middlewares/
│   │   │   └── auth.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   └── ticket.routes.ts
│   │   ├── services/
│   │   │   └── ai.service.ts
│   │   └── index.ts
│   ├── package.json
│   └── prisma.config.ts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthScreen.tsx
│   │   │   ├── AgentDashboard.tsx
│   │   │   ├── CustomerDashboard.tsx
│   │   │   ├── CommentsSection.tsx
│   │   │   └── ui/
│   │   ├── lib/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## Data Model

The Prisma schema currently defines three core entities:

* `User` stores the account identity, password hash, role, and ticket/comment relations.
* `Ticket` stores the support case itself, including status, priority, category, AI-generated response text, and ownership.
* `Comment` stores the threaded conversation for a ticket.

The schema also defines the `Role`, `TicketStatus`, and `Priority` enums.

## API Overview

### Authentication

* `POST /api/auth/register` - create a new user account.
* `POST /api/auth/login` - authenticate and receive a JWT plus user profile data.

### Tickets

All ticket routes require a valid bearer token.

* `POST /api/tickets` - create a new ticket.
* `GET /api/tickets` - list tickets with role-aware visibility, pagination, search, and filters.
* `PATCH /api/tickets/:id` - update ticket status, priority, or assignee.
* `POST /api/tickets/:ticketId/comments` - add a threaded comment to a ticket.

### Health Check

* `GET /api/health` - verifies the backend can reach the database.

## Frontend Behavior

The frontend stores the JWT and serialized user profile in `localStorage` after login. Once authenticated, it renders either the customer dashboard or the agent dashboard based on the user role.

* `AuthScreen` handles login and registration in a single view.
* `CustomerDashboard` lets customers create tickets and expand each ticket to view or add comments.
* `AgentDashboard` provides the triage queue, filtering controls, ticket detail workspace, and assignment/status actions.
* `CommentsSection` is shared by both dashboards for the threaded discussion UI.

## Environment Variables

### Backend

Create a `.env` file in `backend/` with at least the following values:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=your_long_random_secret
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

### Frontend

The frontend uses an optional API override:

```env
VITE_API_URL=http://localhost:5000/api
```

If `VITE_API_URL` is not set, the app defaults to `http://localhost:5000/api`.

## Getting Started

### Prerequisites

* Node.js 20 or later is recommended.
* A running PostgreSQL database.
* A Gemini API key if you want AI triage enabled.

### 1. Install Dependencies

From the project root, install packages for both apps:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure Environment Files

Set up `backend/.env` and `frontend/.env` using the examples above.

### 3. Run Database Migrations

After the backend environment is configured, apply Prisma migrations so the database matches the schema:

```bash
cd backend
npx prisma migrate dev
```

### 4. Start The Backend

```bash
cd backend
npm run dev
```

The backend runs on `http://localhost:5000` by default.

### 5. Start The Frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Vite will print the local frontend URL, usually `http://localhost:5173`.

## Build And Run For Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

## Notes

* The backend uses Prisma with the newer PostgreSQL adapter pattern, so a valid `DATABASE_URL` is required before the server starts cleanly.
* Comment creation logs diagnostic output in development to help trace ticket thread issues.
* If `GEMINI_API_KEY` is not configured, ticket creation still works and the system falls back to deterministic support defaults.
* The current frontend is intentionally simple and workspace-focused: it prioritizes triage speed, role separation, and thread visibility over decorative dashboards.

## Author
Mohit Dev Tomar

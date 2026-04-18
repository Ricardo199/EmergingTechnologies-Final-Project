# Civic Issue Tracker - TODO

**Civic Focus:** General municipal issues (potholes, streetlights, flooding, safety)

---

## 1. Authentication & User Management
- [x] JWT-based registration and login (`signUp`, `login` mutations)
- [x] Role-based access control: `resident`, `staff`, `advocate`
- [x] Auth micro-frontend (login/signup UI with role selection)
- [x] Google OAuth — Backend (auth service, GraphQL mutation/resolver, .env)
- [x] Google OAuth — Frontend AuthMF button integration (GoogleLogin badge, handlers)
- [x] GitHub OAuth — Backend (auth service, GraphQL mutation/resolver, .env)
- [x] GitHub OAuth — Frontend AuthMF button integration (GitHub OAuth flow with callback)

---

## 2. Core Features

### Residents
- [x] Issue reporting with geotag and address (`reportIssue` mutation)
- [x] Issue tracking with status filters (reported, in_progress, resolved, closed)
- [x] AI categorization on submission (rule-based, backend)
- [ ] Photo upload on issue submission
- [ ] Real-time notifications / urgent alerts — optional

### Municipal Staff
- [x] Issue management dashboard (assign, update status, change priority)
- [x] Resolve and triage issues (`resolveIssue`, `updateIssue`, `assignIssue`)
- [x] Analytics: backlog counts, high-priority count, issues by category
- [x] AI trend detection (`trendInsights` query)
- [ ] Heatmap visualization — optional

### Community Advocates
- [x] Trend monitoring via Analytics micro-frontend
- [ ] Comment / upvote on issues — optional
- [ ] Volunteer coordination — optional

---

## 3. Backend

### Architecture (Microservices — all in monorepo, logically separated)
- [x] User Authentication Service (`services/auth.js`)
- [x] Issue Management Service (`services/issuesService.js`)
- [x] Analytics & AI Service (`services/aiService.js`)
- [ ] Community Engagement Service (comments, upvotes) — optional

### Infrastructure
- [x] MongoDB with Mongoose models (`User`, `Issue`)
- [x] GraphQL API via Apollo Server + Express
- [x] JWT middleware in GraphQL context
- [x] Environment config (`.env`)
- [x] Google OAuth service integration (`googleSignIn` mutation)
- [x] Error handling and input validation
- [ ] Gemini API integration (currently rule-based placeholders)
- [ ] LangGraph agent (currently simple heuristic chatbot)

---

## 4. Frontend (React 19.2 + Vite)

### Micro-Frontends
- [x] `AuthMF` — login/signup with role selection
- [x] `IssueReportingMF` — report form (geolocation) + issue list with filters
- [x] `AnalyticsMF` — stats overview, category bar charts, AI trends, staff management table
- [x] `ChatbotMF` — AI assistant chat UI (`agentAnswer` query)

### General
- [x] Apollo Client v4 with auth link (JWT header injection)
- [x] React Router v7 with role-based route guards
- [x] Tailwind CSS v4 via `@tailwindcss/vite`
- [x] Responsive layout (mobile-friendly nav and grids)
- [x] Photo upload UI for issue reporting (file input with preview)
- [x] Real-time alerts / notification banner (context-based notifications with auto-dismiss)

---

## 5. AI Integrations

- [x] Agentic chatbot (`agentAnswer` — answers Q&A about open/resolved issues and trends)
- [x] AI summarization (`aiSummary` query)
- [x] Issue classification & triage (rule-based, `aiService.js`)
- [x] Trend detection (`detectTrends` in `aiService.js`)
- [ ] **Gemini API** — replace rule-based heuristics with real Gemini calls
- [ ] **LangGraph** — upgrade chatbot to multi-step agentic reasoning
- [ ] Sentiment analysis — optional

---

## 6. UI & Design
- [x] Tailwind CSS for all styling
- [x] Responsive design (grid layouts, mobile nav)
- [x] Accessibility audit (ARIA labels, keyboard nav)
  - [x] `<label>` + `id` on all form inputs
  - [x] `role="alert"` + `aria-live` on error/success messages
  - [x] `role="tablist"` / `role="tab"` / `aria-selected` on tab UIs
  - [x] `aria-pressed` on filter toggle buttons
  - [x] `role="progressbar"` + `aria-valuenow` on category bars
  - [x] `scope="col"` + `aria-label` on table, `sr-only` labels for priority selects
  - [x] Descriptive `aria-label` on action buttons (Start/Resolve include issue title)
  - [x] `role="log"` + `aria-live="polite"` on chat message list
  - [x] `sr-only` speaker labels (You/Assistant) in chat
  - [x] `aria-label` on `<nav>`, `aria-current="page"` on active nav links
  - [x] `aria-busy` on submit/send buttons during loading
  - [x] Accessible geolocation button (`aria-label` replaces emoji-only label)
  - [x] `autoComplete` attributes on auth inputs
  - [x] `<time dateTime>` on issue dates

---

## 7. Documentation
- [ ] README with setup instructions (backend + frontend)
- [ ] Document civic focus and 30% customization choices
- [ ] API schema documentation

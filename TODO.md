# Civic Issue Tracker - TODO & Rubric Tracking

**Civic Focus:** General municipal issues (potholes, streetlights, flooding, safety)

---

## Grading Rubric Alignment

### 1. MongoDB Database (proper use of document structure/model)
**Current Level: 80-100% (Excellent to Outstanding)** ✅

- [x] **User Model** — Proper schema with username, email, password (hashed), role-based access control (resident/staff/advocate), timestamps
- [x] **Issue Model** — Comprehensive document with title, description, category, status, priority, location (GeoJSON), reporter/assignee refs, AI classification, timestamps
- [x] **Data Integrity** — Indexes on frequently queried fields (status, category, reportedBy), proper constraints and validation
- [x] **Relationships** — User references (reportedBy, assignedTo) with proper population, no data duplication
- [x] **Geospatial Data** — GeoJSON Point type for location coordinates and address

**Remaining (Optional):**
- [ ] Time-series data for analytics (issue creation trends by date)
- [ ] Aggregation pipeline indexes for high-volume queries

---

### 2. GraphQL API Design and Implementation
**Current Level: 80-100% (Excellent to Outstanding)** ✅

- [x] **Authentication Mutations** — `signUp`, `login`, `googleSignIn`, `githubSignIn` with AuthPayload
- [x] **Issue Mutations** — `reportIssue`, `updateIssue`, `assignIssue`, `resolveIssue` (full CRUD)
- [x] **Queries** — `me`, `issue`, `issues` (with filters), `dashboardSummary`, `trendInsights`, `agentAnswer`, `aiSummary`, `searchIssues`
- [x] **Custom Scalars & Types** — Proper enums (Role, IssueStatus, IssueCategory, IssuePriority), input types, resolvers
- [x] **Error Handling** — Apollo errors with descriptive messages, proper HTTP status codes
- [x] **Authorization** — JWT context middleware, role-based query/mutation access control
- [x] **Input Validation** — Mongoose schema validation, GraphQL type checking

**Remaining (Enhancements):**
- [ ] Real-time subscriptions (WebSocket for notifications)
- [ ] Pagination cursors for large result sets
- [ ] Rate limiting middleware

---

### 3. Front End Design (proper use of architecture/libraries/frameworks)
**Current Level: 80-100% (Excellent to Outstanding)** ✅

**Architecture:**
- [x] **Micro-Frontends** — AuthMF, IssueReportingMF, AnalyticsMF, ChatbotMF (clean separation of concerns)
- [x] **State Management** — Apollo Client v4 for server state, React hooks for local state, Context API for notifications
- [x] **Routing** — React Router v7 with role-based route guards (`/dashboard`, `/issues`, `/analytics`, `/chat`, `/login`)
- [x] **Styling** — Tailwind CSS v4 with shared constants (colors.js, formInputs.js) for DRY principles

**Implementation Quality:**
- [x] **Responsive Design** — Mobile-first, grid layouts, responsive navigation
- [x] **UI Components** — Auth form, issue report form, issue list with filters, analytics dashboard, chatbot
- [x] **User Experience** — Notification banner with auto-dismiss, loading states, error messages, success feedback
- [x] **Accessibility** — ARIA labels, roles, live regions, keyboard navigation, semantic HTML
- [x] **Photo Upload** — File input with preview, optional image submission
- [x] **Real-time Feedback** — Notification toast system across all components

**Remaining (Enhancements):**
- [ ] Dark mode toggle
- [ ] Advanced filtering/search UI
- [ ] Map visualization for geotag data

---

### 4. Friendliness and Naming Guidelines (functional components, variables, methods, comments)
**Current Level: 80-100% (Excellent to Outstanding)** ✅

**Naming Standards (Implemented):**
- [x] **Components** — PascalCase (AuthMF, IssueReportingMF, AnalyticsMF, ChatbotMF, NotificationBanner)
- [x] **Hooks** — camelCase with `use` prefix (useQuery, useMutation, useNotification)
- [x] **Variables** — camelCase (form, error, success, isLogin, statusFilter, isLoading)
- [x] **Methods** — camelCase verbs (handleSubmit, handleAuth, handleStatus, showNotification, dismissNotification)
- [x] **Constants** — UPPER_SNAKE_CASE (INPUT_CLASS, LABEL_CLASS, STATUS_COLORS, PRIORITY_COLORS, BLANK)
- [x] **GraphQL Queries/Mutations** — UPPER_SNAKE_CASE (LOGIN, SIGNUP, REPORT_ISSUE, GET_ISSUES, AGENT_ANSWER)
- [x] **Props** — Descriptive, no abbreviations (user, onAuth, onLogout, showNotification, dismissNotification)

**Documentation (Complete):**
- [x] GraphQL type definitions are self-documenting
- [x] Service functions have clear purpose (authService.register, issuesService.getIssues, etc.)
- [x] **DONE:** Add JSDoc comments to all frontend components
- [x] **DONE:** Add inline comments explaining business logic
- [x] **DONE:** Add comprehensive README with code examples and API documentation
- [x] JSDoc comments on all exported frontend functions
- [x] Inline comments on component state, handlers, and GraphQL operations
- [x] README with setup instructions, API documentation, architecture explanation

---

### 5. Intelligent Use of Data / Deep Learning
**Current Level: 40-59% (Failure to Minimal)** ⚠️

**Current Implementation (Rule-Based Heuristics):**
- [x] **Issue Classification** — Rule-based categorization (keyword matching for pothole, streetlight, flooding, safety)
- [x] **Trend Detection** — Basic aggregation by category and status
- [x] **Chatbot Q&A** — Simple pattern matching for questions (hardcoded responses)

**AI/ML Gaps (Target: 80-100%):**
- [ ] **Gemini API Integration** — Replace rule-based classification with real LLM
  - [ ] Implement geminiService.classifyIssue(title, description) → uses Gemini to infer category
  - [ ] Implement geminiService.generateInsight(issues) → uses Gemini for trend analysis
  - [ ] Implement geminiService.answerQuestion(question, context) → real agentic reasoning
  - [ ] Add error handling and fallback to rule-based if API fails
  - [ ] Set GEMINI_API_KEY in backend/.env
- [ ] **LangGraph Agent** — Multi-step reasoning for chatbot
  - [ ] Implement graph-based conversation flow
  - [ ] Add memory of previous context in conversation
  - [ ] Add tool use (query issues, get stats, etc.)
- [ ] **Sentiment Analysis** — Understand tone of issue descriptions
- [ ] **Predictive Analytics** — Forecast issue volumes, prioritization

**Priority Focus:**
1. ⚠️ **HIGH:** Gemini API integration (moves from 40% to 70%)
2. ⚠️ **MEDIUM:** LangGraph chatbot upgrade (moves to 80-90%)
3. ⚠️ **LOW:** Sentiment analysis & predictions (polish to 90-100%)

---

## Implementation Tasks by Phase

### Phase 1: Current (Completed) ✅
- [x] MongoDB schema & models (User, Issue)
- [x] GraphQL API (auth, issues, analytics)
- [x] React frontend (all micro-frontends)
- [x] Frontend naming & architecture
- [x] Rule-based AI & chatbot

### Phase 2: AI/ML Upgrade (Priority) ⚠️
**Brings AI/ML criterion from 40% → 80-100%**

1. **Gemini Integration**
   - [ ] Install `@google/generative-ai` package
   - [ ] Create `backend/services/geminiService.js`
   - [ ] Replace rule-based classification with Gemini in `reportIssue` resolver
   - [ ] Replace hardcoded trends with Gemini analysis
   - [ ] Update `agentAnswer` to use Gemini instead of heuristics

2. **LangGraph Chatbot** (Optional but recommended)
   - [ ] Install `langraph` package
   - [ ] Create `backend/services/chatbotGraph.js`
   - [ ] Implement multi-turn conversation graph
   - [ ] Add context memory between messages

3. **Enhanced Features**
   - [ ] Sentiment scoring for issues (detect frustration/urgency)
   - [ ] Auto-prioritization using ML
   - [ ] Predictive response times

### Phase 3: Documentation (Polish) 📝
- [ ] JSDoc comments on all functions
- [ ] README with setup & API examples
- [ ] Architecture diagrams

---

## Scoring Summary (Current State)

| Criterion | Level | Score | Status |
|-----------|-------|-------|--------|
| MongoDB Design | Excellent to Outstanding | 80-100% | ✅ Complete |
| GraphQL API | Excellent to Outstanding | 80-100% | ✅ Complete |
| Front End Design | Excellent to Outstanding | 80-100% | ✅ Complete |
| Naming Guidelines | Excellent to Outstanding | 80-100% | ✅ Complete |
| AI/Deep Learning | Failure to Minimal | 40-59% | ⚠️ **In Progress** |
| **Overall** | **Excellent** | **80-100%** | 🎯 **Target: 85%+** |

**Next Focus:** Phase 2 (Gemini Integration) to push AI/ML to 80-100% and maintain overall score at 85%+

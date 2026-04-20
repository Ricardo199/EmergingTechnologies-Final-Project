# Civic Issue Tracker

A full-stack community issue reporting platform with micro-frontend architecture, GraphQL API, geospatial capabilities, and AI-powered insights. Citizens can report municipal issues (potholes, streetlights, flooding, safety) and staff/advocates monitor, prioritize, and resolve them.

## 🎯 Features

### For Residents
- **Report Issues** — Submit community issues with title, description, category, priority, geolocation, and photos
- **View History** — Browse personal issue reports with filtering by status
- **Real-time Feedback** — Toast notifications for action confirmations and errors
- **OAuth Sign-In** — Quick authentication via Google or GitHub

### For Staff & Advocates
- **Dashboard Analytics** — View open/resolved counts, issues by category, AI trend insights
- **Manage Issues** — Update status and priority, resolve issues inline from management table
- **Issue Classification** — Rule-based categorization with AI enhancement capability
- **Search & Filter** — Find issues by status, category, priority

### For All Users
- **AI Chatbot** — Ask questions about community issues, get AI-powered responses
- **Responsive UI** — Mobile-first design with Tailwind CSS v4
- **Accessibility** — WCAG-compliant with ARIA labels, semantic HTML, keyboard navigation
- **Authentication** — Email/password + OAuth (Google, GitHub)

---

## 🏗️ Architecture

### Micro-Frontend Pattern
The frontend uses isolated, self-contained micro-frontends that manage their own state, queries, and UI:

```
Frontend (Vite + React)
├── AuthMF             → Login/signup, OAuth flows
├── IssueReportingMF   → Report form, issue list with filters
├── AnalyticsMF        → Dashboard metrics, issue management table
├── ChatbotMF          → AI assistant chat interface
└── NotificationBanner → Global toast notification system
```

**Benefits:**
- Independent feature updates without full rebuild
- Clear separation of concerns
- Easy to test and maintain
- Scalable for team development

### Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Vite, Tailwind CSS 4, Apollo Client, React Router 7 |
| **Backend** | Node.js, Express, GraphQL, Apollo Server 4 |
| **Database** | MongoDB (Mongoose), GeoJSON geospatial data |
| **Authentication** | JWT, OAuth 2.0 (Google, GitHub) |
| **AI/ML** | Rule-based classification + Gemini API (active), LangGraph agent (in progress) |
| **File Upload** | Base64 image encoding in GraphQL mutations |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 5.0+ (local or Atlas)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Ricardo199/final-project.git
cd final-project

# Backend setup
cd backend
npm install
cp .env.example .env  # Configure MongoDB, JWT_SECRET, OAuth tokens

# Frontend setup
cd ../frontend
npm install
cp .env.example .env  # Configure VITE_GOOGLE_CLIENT_ID, VITE_GITHUB_CLIENT_ID
```

### Environment Variables

**Backend (.env)**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/civic-db
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GEMINI_API_KEY=your_gemini_api_key  # Optional, for AI features
```

**Frontend (.env)**
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

### Running Locally

```bash
# Terminal 1: Start Backend (port 4001)
cd backend
npm start

# Terminal 2: Start Frontend (port 5173)
cd frontend
npm run dev

# Open http://localhost:5173
```

### Running Tests

```bash
# Backend (Jest)
cd backend
npm test

# Frontend (Vitest)
cd frontend
npm test
```

---

## 📚 API Documentation

### Authentication

#### Sign Up (Email/Password)
```graphql
mutation SignUp($username: String!, $email: String!, $password: String!, $role: Role) {
  signUp(username: $username, email: $email, password: $password, role: $role) {
    accessToken
    user { _id username email role }
  }
}
```

#### Log In
```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    accessToken
    user { _id username email role }
  }
}
```

#### Google Sign-In
```graphql
mutation GoogleSignIn($token: String!) {
  googleSignIn(token: $token) {
    accessToken
    user { _id username email role }
  }
}
```

### Issues

#### Report Issue
```graphql
mutation ReportIssue($input: ReportIssueInput!) {
  reportIssue(input: $input) {
    _id title category status priority
    location { address coordinates }
    reportedBy { username }
  }
}

input ReportIssueInput {
  title: String!
  description: String!
  category: IssueCategory!
  priority: IssuePriority!
  location: LocationInput!
}

input LocationInput {
  type: String!  # "Point"
  coordinates: [Float!]!  # [longitude, latitude]
  address: String!
}
```

#### Get Issues
```graphql
query Issues($status: IssueStatus) {
  issues(status: $status) {
    _id title category status priority createdAt
    location { address coordinates }
    reportedBy { username }
    assignedTo { username }
  }
}

enum IssueStatus { REPORTED IN_PROGRESS RESOLVED CLOSED }
enum IssueCategory { POTHOLE STREETLIGHT FLOODING SAFETY OTHER }
enum IssuePriority { LOW MEDIUM HIGH }
```

#### Update Issue (Staff Only)
```graphql
mutation UpdateIssue($id: ID!, $status: IssueStatus, $priority: IssuePriority) {
  updateIssue(id: $id, status: $status, priority: $priority) {
    _id status priority updatedAt
  }
}
```

### Analytics

#### Dashboard Summary (Staff Only)
```graphql
query Dashboard {
  dashboardSummary {
    totalOpen
    totalResolved
    highPriority
    byCategory { category count }
  }
}
```

#### Trend Insights (Staff Only)
```graphql
query Dashboard {
  trendInsights { category count }
}
```

### Chatbot

#### Ask AI Assistant
```graphql
query AgentAnswer($question: String!) {
  agentAnswer(question: $question)
}
```

---

## 📁 Project Structure

```
.
├── backend/
│   ├── server.js                 # Express + Apollo Server setup
│   ├── package.json
│   ├── .env
│   ├── graphQL/
│   │   ├── typeDefs.js          # GraphQL schema (Query, Mutation, types)
│   │   └── resolvers.js         # Query & mutation implementations
│   ├── model/
│   │   ├── user.js              # Mongoose User schema
│   │   └── issue.js             # Mongoose Issue schema (with GeoJSON)
│   ├── services/
│   │   ├── auth.js              # JWT, OAuth token handling
│   │   ├── issuesService.js     # Issue business logic
│   │   ├── aiService.js         # AI classification + Gemini integration
│   │   └── langGraphGPT.js      # LangGraph multi-node agent (Phase 3)
│   ├── tests/
│   │   └── aiService.test.js    # Jest unit tests for AI service
│   └── utils/
│       └── logger.js            # Winston logger setup
│
├── frontend/
│   ├── vite.config.js
│   ├── package.json
│   ├── index.html
│   ├── eslint.config.js
│   ├── src/
│   │   ├── main.jsx            # Entry point (React 19)
│   │   ├── App.jsx             # Main router & layout
│   │   ├── index.css
│   │   ├── App.css
│   │   ├── components/
│   │   │   ├── NotificationBanner.jsx          # Toast UI
│   │   │   └── microfrontends/
│   │   │       ├── AuthMF.jsx                  # Auth forms
│   │   │       ├── IssueReportingMF.jsx        # Report & list
│   │   │       ├── AnalyticsMF.jsx             # Dashboard
│   │   │       └── ChatbotMF.jsx               # Chatbot
│   │   ├── context/
│   │   │   └── NotificationContext.jsx        # Global notification state
│   │   ├── styles/
│   │   │   ├── colors.js                      # Color constants
│   │   │   └── formInputs.js                  # Form styling
│   │   └── tests/
│   │       ├── NotificationContext.test.jsx   # Notification context tests
│   │       ├── styles.test.js                 # Style utility tests
│   │       └── setup.js                       # Vitest setup
│   └── public/
│
└── README.md (this file)
```

---

## 🔐 Authentication Flow

### Email/Password
1. User submits credentials in AuthMF form
2. Backend hashes password, creates JWT token
3. Token stored in `localStorage`, included in subsequent requests via Apollo authLink

### OAuth (Google/GitHub)
1. User clicks OAuth button → redirected to provider
2. Provider returns auth code/token to backend
3. Backend exchanges code for user info, creates/finds user, issues JWT
4. Frontend stores token and redirects to dashboard

### Protected Routes
- `/dashboard` — Requires auth (any role)
- `/analytics` — Requires staff or advocate role
- `/chat` — Requires auth (any role)

---

## 🧪 Development Guidelines

### Code Quality

**Naming Conventions:**
- **Components:** PascalCase (`AuthMF`, `NotificationBanner`)
- **Hooks:** `use` prefix + camelCase (`useQuery`, `useNotification`)
- **Variables:** camelCase (`userName`, `isLoading`, `statusFilter`)
- **Constants:** UPPER_SNAKE_CASE (`INPUT_CLASS`, `STATUS_COLORS`)
- **Methods:** camelCase verbs (`handleSubmit`, `showNotification`)

**Documentation Standards:**
- JSDoc comments on all exported functions
- Inline comments explaining complex logic
- GraphQL queries/mutations documented with query structure
- Props destructuring with type descriptions

**Example (Frontend Component):**
```jsx
/**
 * AuthMF - Authentication Micro-Frontend
 * Handles user registration, login, and OAuth sign-in flows
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onAuth - Callback fired after successful authentication
 * @returns {JSX.Element} Authentication form UI
 */
export default function AuthMF({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  // ...
}
```

### Component State Management

**Local State (Hooks):**
- Form inputs, UI toggles, loading states
- Use `useState` for simple state, `useReducer` for complex workflows

**Server State (Apollo Client):**
- Data from GraphQL queries/mutations
- Automatic caching via Apollo InMemoryCache
- Refetch/poll for real-time updates

**Global State (Context API):**
- NotificationContext for cross-component notifications
- Avoid prop-drilling for shared UI state

---

## 🧠 AI/ML Strategy

- **Category Classification** — Keyword matching with Gemini API fallback (`aiService.classifyIssue`)
- **Trend Analysis** — Aggregation by category/status with `detectTrends`, `generatePredictions`, `generateAlerts`
- **Chatbot** — Pattern matching with Gemini-powered responses via `answerQuestion`
- **Issue Summarization** — Gemini-generated or rule-based fallback via `summarizeIssue`
- `aiService.js` calls `gemini-pro` when `GEMINI_API_KEY` is set; falls back to rule-based logic automatically

---

## 📊 Database Schema

### User
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: Enum ['resident', 'staff', 'advocate'],
  createdAt: Date,
  updatedAt: Date
}
```

### Issue
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: Enum ['pothole', 'streetlight', 'flooding', 'safety', 'other'],
  priority: Enum ['low', 'medium', 'high'],
  status: Enum ['reported', 'in_progress', 'resolved', 'closed'],
  location: {
    type: 'Point',
    coordinates: [longitude, latitude],
    address: String
  },
  photo: Binary,  // Base64 encoded
  reportedBy: ObjectId (ref: User),
  assignedTo: ObjectId (ref: User, nullable),
  aiClassification: {
    category: String,
    priority: String,
    confidence: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/your-feature`)
3. **Follow** naming conventions and documentation standards
4. **Test** locally before pushing
5. **Submit** a pull request with description

---

## 📝 License

This project is licensed under the **GNU General Public License v3.0** (GPLv3).

See [LICENSE](./LICENSE) file for details. This means you are free to use, modify, and distribute this software under the terms of the GPLv3. If you distribute this project or modifications, you must include the license and disclose your changes.

---

## 📧 Support

For issues or questions:
1. Check existing GitHub issues
2. Review API documentation above
3. Consult inline code comments
4. Ask the AI Assistant chatbot in-app



# Civic Issue Tracker — Frontend

React 19 + Vite frontend for the Civic Issue Tracker platform.

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 19 | UI framework |
| Vite | 6 | Dev server & bundler |
| Tailwind CSS | 4 | Utility-first styling |
| Apollo Client | 3 | GraphQL data fetching & caching |
| React Router | 7 | Client-side routing |

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment template and fill in values
cp .env.example .env

# Start the dev server (http://localhost:5173)
npm run dev
```

> **Note:** The backend must be running on port 4001 before starting the frontend. See the [root README](../README.md) for full setup instructions.

## Environment Variables

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm test` | Run Vitest unit tests |
| `npm run lint` | Run ESLint |

## Architecture

The frontend is structured as a set of isolated **micro-frontends**, each responsible for a single feature domain:

```
src/
├── components/
│   ├── microfrontends/
│   │   ├── AuthMF.jsx             # Login / sign-up / OAuth
│   │   ├── IssueReportingMF.jsx   # Submit and browse issues
│   │   ├── AnalyticsMF.jsx        # Staff dashboard & management
│   │   └── ChatbotMF.jsx          # AI assistant chat
│   └── NotificationBanner.jsx     # Global toast notifications
├── context/
│   └── NotificationContext.jsx    # Cross-component notification state
├── styles/
│   ├── colors.js                  # Shared color constants
│   └── formInputs.js              # Shared form class constants
└── tests/
    ├── NotificationContext.test.jsx
    └── styles.test.js
```

## Testing

```bash
npm test
```

Tests are written with [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

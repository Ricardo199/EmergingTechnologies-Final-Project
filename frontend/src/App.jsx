/**
 * App.jsx - Root Application Component
 * Sets up Apollo Client, routing, authentication state, and global layout.
 *
 * Apollo Client: connects to GraphQL endpoint at http://localhost:4002/graphql
 *                attaches JWT from localStorage to every request via authLink
 *
 * Routes:
 *   /                       → redirect to /dashboard or /login
 *   /login                  → AuthMF (unauthenticated only)
 *   /auth/github/callback   → GitHubCallback (OAuth redirect handler)
 *   /dashboard              → Dashboard (authenticated)
 *   /issues                 → IssueReportingMF (authenticated)
 *   /analytics              → AnalyticsMF (staff/advocate only)
 *   /chat                   → ChatbotMF (authenticated)
 */
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { ApolloProvider, useQuery, useMutation } from '@apollo/client/react';
import { setContext } from '@apollo/client/link/context';

import { NotificationProvider } from './context/NotificationContext';
import NotificationBanner from './components/NotificationBanner';
import AuthMF from './components/microfrontends/AuthMF';
import IssueReportingMF from './components/microfrontends/IssueReportingMF';
import AnalyticsMF from './components/microfrontends/AnalyticsMF';
import ChatbotMF from './components/microfrontends/ChatbotMF';

// Apollo HTTP link pointing to the GraphQL backend
const httpLink = createHttpLink({ uri: 'http://localhost:4002/graphql' });

// Auth link: injects JWT Bearer token from localStorage into every request header
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return { headers: { ...headers, authorization: token ? `Bearer ${token}` : '' } };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const DASHBOARD_SUMMARY = gql`
  query {
    dashboardSummary { totalOpen totalResolved highPriority }
  }
`;

const GITHUB_SIGNIN = gql`
  mutation GitHubSignIn($code: String!) {
    githubSignIn(code: $code) {
      accessToken
      user { _id username email role }
    }
  }
`;

/**
 * Handles the GitHub OAuth redirect, extracts the code, and calls the mutation.
 */
function GitHubCallback({ onAuth }) {
  const navigate = useNavigate();
  const [githubSignIn] = useMutation(GITHUB_SIGNIN);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) { navigate('/login'); return; }

    githubSignIn({ variables: { code } })
      .then(({ data }) => {
        const { accessToken, user } = data.githubSignIn;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        onAuth(user);
        navigate('/dashboard');
      })
      .catch(() => navigate('/login'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <p className="text-center mt-20 text-gray-500">Signing in with GitHub...</p>;
}

/**
 * Dashboard Component
 * Landing page for authenticated users showing quick-access cards
 * and live summary metrics (open, resolved, high-priority issue counts).
 *
 * @param {Object} props
 * @param {Object} props.user - Authenticated user object
 */
function Dashboard({ user }) {
  const { data } = useQuery(DASHBOARD_SUMMARY);
  const s = data?.dashboardSummary;
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome, {user.username}!</h2>
        <p className="text-sm text-gray-500 capitalize">{user.role} account</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/issues" className="bg-blue-50 p-5 rounded-xl hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-blue-800">Report an Issue</h3>
          <p className="text-blue-600 text-sm mt-1">Submit a new community issue</p>
        </Link>
        {(user.role === 'staff' || user.role === 'advocate') && (
          <Link to="/analytics" className="bg-purple-50 p-5 rounded-xl hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-purple-800">Analytics</h3>
            <p className="text-purple-600 text-sm mt-1">Dashboards and management tools</p>
          </Link>
        )}
        <Link to="/chat" className="bg-green-50 p-5 rounded-xl hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-green-800">AI Assistant</h3>
          <p className="text-green-600 text-sm mt-1">Ask questions about community issues</p>
        </Link>
      </div>
      {s && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Open Issues', value: s.totalOpen, color: 'text-yellow-600' },
            { label: 'Resolved', value: s.totalResolved, color: 'text-green-600' },
            { label: 'High Priority', value: s.highPriority, color: 'text-red-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm border p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Nav Component
 * Top navigation bar with role-aware links and logout button.
 * Highlights the active route using aria-current and border styling.
 *
 * @param {Object} props
 * @param {Object|null} props.user - Authenticated user or null
 * @param {Function} props.onLogout - Callback to clear auth state
 */
function Nav({ user, onLogout }) {
  const location = useLocation();
  const navLink = (to, label) => (
    <Link
      to={to}
      aria-current={location.pathname === to ? 'page' : undefined}
      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
        location.pathname === to
          ? 'border-indigo-600 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav aria-label="Main navigation" className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-indigo-600">CivicConnect</Link>
            {user && (
              <div className="hidden sm:flex gap-6">
                {navLink('/dashboard', 'Dashboard')}
                {navLink('/issues', 'Issues')}
                {(user.role === 'staff' || user.role === 'advocate') && navLink('/analytics', 'Analytics')}
                {navLink('/chat', 'AI Assistant')}
              </div>
            )}
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 capitalize" aria-label={`Logged in as ${user.username}, role: ${user.role}`}>{user.username} · {user.role}</span>
                <button onClick={onLogout} className="text-sm text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-500">Login</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

/**
 * App Component
 * Root component managing global auth state and rendering the router.
 * Auth state is persisted to localStorage and rehydrated on page load.
 */
function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleAuth = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <ApolloProvider client={client}>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <NotificationBanner />
            <Nav user={user} onLogout={handleLogout} />
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
                <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <AuthMF onAuth={handleAuth} />} />
                <Route path="/auth/github/callback" element={<GitHubCallback onAuth={handleAuth} />} />
                <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
                <Route path="/issues" element={user ? <IssueReportingMF user={user} /> : <Navigate to="/login" />} />
                <Route
                  path="/analytics"
                  element={
                    user && (user.role === 'staff' || user.role === 'advocate')
                      ? <AnalyticsMF user={user} />
                      : <Navigate to="/dashboard" />
                  }
                />
                <Route path="/chat" element={user ? <ChatbotMF /> : <Navigate to="/login" />} />
              </Routes>
            </main>
          </div>
        </Router>
      </NotificationProvider>
    </ApolloProvider>
  );
}

export default App;

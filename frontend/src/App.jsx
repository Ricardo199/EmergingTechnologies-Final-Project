import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { ApolloProvider, useQuery } from '@apollo/client/react';
import { setContext } from '@apollo/client/link/context';

import AuthMF from './components/microfrontends/AuthMF';
import IssueReportingMF from './components/microfrontends/IssueReportingMF';
import AnalyticsMF from './components/microfrontends/AnalyticsMF';
import ChatbotMF from './components/microfrontends/ChatbotMF';

const httpLink = createHttpLink({ uri: 'http://localhost:4001/graphql' });

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

function Nav({ user, onLogout }) {
  const location = useLocation();
  const navLink = (to, label) => (
    <Link
      to={to}
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
    <nav className="bg-white shadow-sm">
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
                <span className="text-sm text-gray-600 capitalize">{user.username} · {user.role}</span>
                <button onClick={onLogout} className="text-sm text-indigo-600 hover:text-indigo-500">Logout</button>
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
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Nav user={user} onLogout={handleLogout} />
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
              <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <AuthMF onAuth={handleAuth} />} />
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
    </ApolloProvider>
  );
}

export default App;

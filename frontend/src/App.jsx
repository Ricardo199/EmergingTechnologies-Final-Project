import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

import AuthMF from './components/microfrontends/AuthMF';
import IssueReportingMF from './components/microfrontends/IssueReportingMF';
import AnalyticsMF from './components/microfrontends/AnalyticsMF';
import ChatbotMF from './components/microfrontends/ChatbotMF';

// Apollo Client setup
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleAuth = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <ApolloProvider client={client}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          {/* Navigation */}
          <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <h1 className="text-xl font-bold text-indigo-600">CivicConnect</h1>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {user && (
                      <>
                        <a href="/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                          Dashboard
                        </a>
                        <a href="/report" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                          Report Issue
                        </a>
                        {(user.role === 'staff' || user.role === 'advocate') && (
                          <a href="/analytics" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                            Analytics
                          </a>
                        )}
                        <a href="/chat" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                          AI Assistant
                        </a>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  {user ? (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-700">
                        {user.email} ({user.role})
                      </span>
                      <button
                        onClick={handleLogout}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <a href="/login" className="text-sm text-indigo-600 hover:text-indigo-500">
                      Login
                    </a>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={
                user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
              } />
              <Route path="/login" element={
                user ? <Navigate to="/dashboard" /> : <AuthMF onAuth={handleAuth} />
              } />
              <Route path="/dashboard" element={
                user ? <Dashboard user={user} /> : <Navigate to="/login" />
              } />
              <Route path="/report" element={
                user ? <IssueReportingMF user={user} /> : <Navigate to="/login" />
              } />
              <Route path="/analytics" element={
                user && (user.role === 'staff' || user.role === 'advocate') ? 
                  <AnalyticsMF user={user} /> : <Navigate to="/dashboard" />
              } />
              <Route path="/chat" element={
                user ? <ChatbotMF /> : <Navigate to="/login" />
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </ApolloProvider>
  );
}

function Dashboard({ user }) {
  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome back, {user.email}!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800">Report an Issue</h3>
              <p className="text-blue-600 mt-2">Submit a new issue report with photos and location</p>
              <a href="/report" className="mt-4 inline-block text-blue-700 hover:text-blue-900 font-medium">
                Report Now →
              </a>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800">Track Your Reports</h3>
              <p className="text-green-600 mt-2">Check the status of your submitted issues</p>
              <a href="/dashboard" className="mt-4 inline-block text-green-700 hover:text-green-900 font-medium">
                View Reports →
              </a>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800">AI Assistant</h3>
              <p className="text-purple-600 mt-2">Get answers to your questions about community issues</p>
              <a href="/chat" className="mt-4 inline-block text-purple-700 hover:text-purple-900 font-medium">
                Chat Now →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Reports</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">12</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">8</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
            <dd className="mt-1 text-3xl font-semibold text-yellow-600">3</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
            <dd className="mt-1 text-3xl font-semibold text-red-600">1</dd>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
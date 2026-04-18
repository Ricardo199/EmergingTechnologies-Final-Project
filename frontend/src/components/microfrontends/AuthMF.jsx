import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { GoogleLogin } from '@react-oauth/google';
import { useNotification } from '../../context/NotificationContext';
import { INPUT_CLASS, LABEL_CLASS, BUTTON_PRIMARY, SELECT_CLASS } from '../../styles/formInputs';

/**
 * AuthMF - Authentication Micro-Frontend
 * Handles user registration, login, and OAuth sign-in flows (Google, GitHub)
 * Manages form state and persists authentication tokens to localStorage
 * 
 * Features:
 * - Email/password registration with role selection
 * - Email/password login
 * - Google OAuth sign-in
 * - GitHub OAuth sign-in
 * - Real-time error/success notifications
 * - Loading states during authentication
 */

// GraphQL mutation: Email/password login
// Returns JWT token and user profile
const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      user { _id username email role }
    }
  }
`;

// GraphQL mutation: Email/password registration
// Returns JWT token and newly created user profile
const SIGNUP = gql`
  mutation SignUp($username: String!, $email: String!, $password: String!, $role: Role) {
    signUp(username: $username, email: $email, password: $password, role: $role) {
      accessToken
      user { _id username email role }
    }
  }
`;

// GraphQL mutation: Google OAuth sign-in
// Frontend sends Google ID token, backend verifies and creates/finds user
const GOOGLE_SIGNIN = gql`
  mutation GoogleSignIn($token: String!) {
    googleSignIn(token: $token) {
      accessToken
      user { _id username email role }
    }
  }
`;

// GraphQL mutation: GitHub OAuth sign-in
// Frontend sends auth code, backend exchanges for access token and fetches user
const GITHUB_SIGNIN = gql`
  mutation GitHubSignIn($code: String!) {
    githubSignIn(code: $code) {
      accessToken
      user { _id username email role }
    }
  }
`;

/**
 * AuthMF Component
 * @component
 * @param {Object} props
 * @param {Function} props.onAuth - Callback fired after successful authentication with user data
 * @returns {JSX.Element} Authentication form and OAuth buttons
 * 
 * @example
 * <AuthMF onAuth={(user) => setUser(user)} />
 */
export default function AuthMF({ onAuth }) {
  // Toggle between login and signup modes
  const [isLogin, setIsLogin] = useState(true);
  
  // Form state for email/password authentication
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    role: 'resident' // Default role for new users
  });
  
  // Error message display
  const [error, setError] = useState('');
  
  // Notification system for feedback messages
  const { showNotification } = useNotification();

  // Apollo mutations for different auth methods
  const [login, { loading: loginLoading }] = useMutation(LOGIN);
  const [signUp, { loading: signupLoading }] = useMutation(SIGNUP);
  const [googleSignIn, { loading: googleLoading }] = useMutation(GOOGLE_SIGNIN);
  const [githubSignIn, { loading: githubLoading }] = useMutation(GITHUB_SIGNIN);
  
  // Combined loading state (disable buttons while any auth is pending)
  const loading = loginLoading || signupLoading || googleLoading || githubLoading;

  /**
   * Generic form field updater
   * Creates closure to handle multiple form fields
   * @param {string} key - Form field key (username, email, password, role)
   * @returns {Function} Event handler for input changes
   */
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  /**
   * Handle successful authentication
   * Stores JWT token and user profile in localStorage
   * Calls parent callback to update app auth state
   * Shows welcome notification
   * @param {Object} payload - AuthPayload from backend
   * @param {string} payload.accessToken - JWT token
   * @param {Object} payload.user - User profile data
   */
  const handleAuth = (payload) => {
    // Store JWT token for subsequent API requests
    localStorage.setItem('token', payload.accessToken);
    // Store user profile for display and role-based UI
    localStorage.setItem('user', JSON.stringify(payload.user));
    showNotification(`Welcome, ${payload.user.username}!`, 'success', 2000);
    onAuth(payload.user);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = isLogin
        ? await login({ variables: { email: form.email, password: form.password } })
        : await signUp({ variables: form });
      const payload = isLogin ? data.login : data.signUp;
      handleAuth(payload);
    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    try {
      const { data } = await googleSignIn({ variables: { token: credentialResponse.credential } });
      handleAuth(data.googleSignIn);
    } catch (err) {
      setError(err.message);
      showNotification(err.message, 'error');
    }
  };

  const handleGoogleError = () => {
    const msg = 'Google sign-in failed. Please try again.';
    setError(msg);
    showNotification(msg, 'error');
  };

  const handleGitHubClick = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = 'user:email';
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-indigo-600 mb-6 text-center">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={error ? 'auth-error' : undefined} noValidate>
          {!isLogin && (
            <div>
              <label htmlFor="username" className={LABEL_CLASS}>Username</label>
              <input
                id="username"
                className={INPUT_CLASS}
                placeholder="Enter your username"
                value={form.username}
                onChange={set('username')}
                autoComplete="username"
                required
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className={LABEL_CLASS}>Email</label>
            <input
              id="email"
              className={INPUT_CLASS}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className={LABEL_CLASS}>Password</label>
            <input
              id="password"
              className={INPUT_CLASS}
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={set('password')}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
            />
          </div>
          {!isLogin && (
            <div>
              <label htmlFor="role" className={LABEL_CLASS}>Role</label>
              <select
                id="role"
                className={SELECT_CLASS}
                value={form.role}
                onChange={set('role')}
              >
                <option value="resident">Resident</option>
                <option value="staff">Staff</option>
                <option value="advocate">Advocate</option>
              </select>
            </div>
          )}
          {error && (
            <p id="auth-error" role="alert" className="text-red-600 text-sm">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            aria-busy={loading}
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-xs text-gray-500 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text={isLogin ? 'signin_with' : 'signup_with'}
            />
          </div>
          <button
            type="button"
            onClick={handleGitHubClick}
            disabled={loading}
            className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            aria-label="Sign in with GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Sign in with GitHub
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            className="text-indigo-600 hover:underline focus:outline-none focus:underline"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      user { _id username email role }
    }
  }
`;

const SIGNUP = gql`
  mutation SignUp($username: String!, $email: String!, $password: String!, $role: Role) {
    signUp(username: $username, email: $email, password: $password, role: $role) {
      accessToken
      user { _id username email role }
    }
  }
`;

const inputClass = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400';

export default function AuthMF({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'resident' });
  const [error, setError] = useState('');

  const [login, { loading: loginLoading }] = useMutation(LOGIN);
  const [signUp, { loading: signupLoading }] = useMutation(SIGNUP);
  const loading = loginLoading || signupLoading;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = isLogin
        ? await login({ variables: { email: form.email, password: form.password } })
        : await signUp({ variables: form });
      const payload = isLogin ? data.login : data.signUp;
      localStorage.setItem('token', payload.accessToken);
      localStorage.setItem('user', JSON.stringify(payload.user));
      onAuth(payload.user);
    } catch (err) {
      setError(err.message);
    }
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
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                id="username"
                className={inputClass}
                placeholder="Enter your username"
                value={form.username}
                onChange={set('username')}
                autoComplete="username"
                required
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              className={inputClass}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              className={inputClass}
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
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                id="role"
                className={inputClass}
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
        <p className="text-center text-sm text-gray-500 mt-4">
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

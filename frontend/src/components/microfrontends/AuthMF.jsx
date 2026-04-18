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
        <h2 className="text-2xl font-bold text-indigo-600 mb-6 text-center">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Username"
              value={form.username}
              onChange={set('username')}
              required
            />
          )}
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={set('email')}
            required
          />
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={set('password')}
            required
          />
          {!isLogin && (
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={form.role}
              onChange={set('role')}
            >
              <option value="resident">Resident</option>
              <option value="staff">Staff</option>
              <option value="advocate">Advocate</option>
            </select>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button className="text-indigo-600 hover:underline" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}

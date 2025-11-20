// src/components/LoginForm.tsx
import { useState } from 'react';

interface LoginFormProps {
  onLogin: (credentials: { username: string; password: string }) => void;
  error: string | null;
  isLoggingIn: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, error, isLoggingIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempted with:', { username, password });
    onLogin({ username, password });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm mx-4">
      <h2 className="text-header text-center text-dark-grey mb-6">
        Welcome!
      </h2>

      <form onSubmit={handleSubmit} className="space-y-7">
        <div>
          <label className="block text-big-text text-dark-grey mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-fill-text text-dark-grey"
            placeholder="Enter your username"
            disabled={isLoggingIn}
          />
        </div>

        <div>
          <label className="block text-big-text text-dark-grey mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-fill-text text-dark-grey"
            placeholder="Enter your password"
            disabled={isLoggingIn}
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-muted-purple text-white py-3 rounded-lg text-button-text transition-transform duration-150 active:bg-dark-purple active:scale-95 disabled:opacity-50"
          disabled={isLoggingIn || !username || !password}
        >
          {isLoggingIn ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default LoginForm;
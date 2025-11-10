// src/components/LoginForm.tsx
import { useState } from 'react';

interface LoginFormProps {
  onLogin: () => void; // This will now trigger navigation to WelcomePage
}

function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempted with:', { username, password });
    onLogin();
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
          />
        </div>

        <button
        type="submit"
        className="w-full bg-muted-purple text-white py-3 rounded-lg text-button-text transition-transform duration-150 active:bg-dark-purple active:scale-95"
        >
        Sign In
        </button>
      </form>
    </div>
  );
}

export default LoginForm;
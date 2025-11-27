// src/pages/LoginPage.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import AnimatedWaveBackground from '../components/AnimatedWaveBackground';
import LoginForm from '../components/LoginForm';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (credentials: { username: string; password: string }) => {
    setIsLoggingIn(true);
    setError(null); // Clear previous errors

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        // If the server responds with an error, display it.
        throw new Error(data.message || 'An unknown error occurred.');
      }

      // On success, save the auth data (token, etc.) to localStorage.
      localStorage.setItem('userAuth', JSON.stringify(data));
      
      // Call the success handler to navigate to the next page.
      onLoginSuccess();

    } catch (err: any) {
      setError(err.message);
      setIsLoggingIn(false); // Stop the loading indicator on error.
    }
  };

  return (
    <motion.div
      key="login-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
    >
      {/* Animated Background */}
      <AnimatedWaveBackground />
      
      {/* Login Form with Logo */}
      <div className="relative z-10 w-full flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {!isLoggingIn ? (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ 
                opacity: 0,
                scale: 0.8,
                transition: { duration: 1.5, ease: "easeInOut" }
              }}
              className="flex flex-col items-center w-full max-w-sm sm:max-w-md px-4 sm:px-6"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6 sm:mb-8"
              >
                <img 
                  src="/logo.png"
                  alt="App Logo" 
                  className="w-32 h-32 sm:w-40 sm:h-40 md:w-45 md:h-45 object-contain"
                />
              </motion.div>

              {/* Login Form */}
              <LoginForm onLogin={handleLogin} error={error} isLoggingIn={isLoggingIn} />
            </motion.div>
          ) : (
            <motion.div
              key="loading-transition"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default LoginPage;
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

  const handleLogin = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
      onLoginSuccess();
    }, 2000);
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
      <div className="relative z-10 w-full flex items-center justify-center min-h-screen">
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
              className="flex flex-col items-center w-full max-w-sm px-6"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-8"
              >
                <img 
                  src="/logo.png"
                  alt="App Logo" 
                  className="w-45 h-45 object-contain"
                />
              </motion.div>

              {/* Login Form */}
              <LoginForm onLogin={handleLogin} />
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
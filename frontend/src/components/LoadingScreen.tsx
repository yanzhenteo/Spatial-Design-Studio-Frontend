// src/components/LoadingScreen.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getShuffledDementiaData, type DementiaFactOrMyth } from '../services/loadingService';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Analyzing your space..."
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledData, setShuffledData] = useState<DementiaFactOrMyth[]>([]);

  // Initialize shuffled data on mount
  useEffect(() => {
    setShuffledData(getShuffledDementiaData());
  }, []);

  // Auto-rotate carousel every 25 seconds
  useEffect(() => {
    if (shuffledData.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffledData.length);
    }, 25000); // 25 seconds

    return () => clearInterval(interval);
  }, [shuffledData.length]);

  if (shuffledData.length === 0) {
    return null;
  }

  const currentItem = shuffledData[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-gradient-yellow-to-pink flex flex-col items-center justify-center p-6">
      {/* Loading Spinner */}
      <div className="mb-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-dark-grey"></div>
      </div>

      {/* Loading Message */}
      <h2 className="text-header text-dark-grey mb-8 text-center">
        {message}
      </h2>

      {/* Fact/Myth Carousel Card */}
      <div className="w-full max-w-2xl bg-white border-2 border-gray-300 rounded-lg shadow-lg p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Icon - Fact (Tick) or Myth (Cross) */}
            <div className="flex justify-center">
              {currentItem.isFact ? (
                // Tick Icon (Fact)
                <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center bg-green-50">
                  <svg
                    className="w-12 h-12 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              ) : (
                // Cross Icon (Myth)
                <div className="w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center bg-red-50">
                  <svg
                    className="w-12 h-12 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Fact or Myth Label */}
            <div className="text-center">
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                  currentItem.isFact
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {currentItem.isFact ? 'FACT' : 'MYTH'}
              </span>
            </div>

            {/* Statement */}
            <h3 className="text-xl font-bold text-dark-grey text-center">
              {currentItem.statement}
            </h3>

            {/* Explanation */}
            <p className="text-base text-gray-700 text-center leading-relaxed">
              {currentItem.explanation}
            </p>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 pt-4">
              {shuffledData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-purple-600 w-6'
                      : 'bg-gray-400 w-2 hover:bg-gray-500'
                  }`}
                  aria-label={`Go to item ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress hint */}
      <p className="text-sm text-dark-grey mt-6 opacity-75 text-center">
        This may take a moment. Meanwhile, learn something new!
      </p>
    </div>
  );
};

export default LoadingScreen;

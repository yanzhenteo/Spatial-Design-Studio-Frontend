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

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % shuffledData.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + shuffledData.length) % shuffledData.length);
  };

  if (shuffledData.length === 0) {
    return null;
  }

  const currentItem = shuffledData[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-gradient-yellow-to-pink flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Loading Spinner */}
      <div className="mb-6 sm:mb-8">
        <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-dark-grey"></div>
      </div>

      {/* Loading Message */}
      <h2 className="text-header text-dark-grey mb-6 sm:mb-8 text-center px-2">
        {message}
      </h2>

      {/* Fact/Myth Carousel Card with Navigation */}
      <div className="w-full max-w-md sm:max-w-lg bg-white border-2 border-gray-300 rounded-lg shadow-lg p-6 sm:p-8 md:p-10 relative">
        {/* Left Arrow */}
        <button
          onClick={prevSlide}
          className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200 z-10"
          aria-label="Previous fact"
        >
          <svg 
            className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right Arrow */}
        <button
          onClick={nextSlide}
          className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200 z-10"
          aria-label="Next fact"
        >
          <svg 
            className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 sm:space-y-8 mx-8 sm:mx-10 md:mx-12 py-2 sm:py-4"
          >
            {/* Fact or Myth Badge - Made larger and more prominent */}
            <div className="text-center">
              <span
                className={`inline-block px-4 py-3 rounded-full text-lg sm:text-xl font-bold ${
                  currentItem.isFact
                    ? 'bg-green-100 text-green-800 border-2 border-green-300'
                    : 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                }`}
              >
                {currentItem.isFact ? '💡 FACT' : '❓ MYTH'}
              </span>
            </div>

            {/* Statement */}
            <h3 className="text-lg sm:text-xl font-bold text-dark-grey text-center leading-tight">
              {currentItem.statement}
            </h3>

            {/* Explanation */}
            <p className="text-sm sm:text-base text-gray-700 text-center leading-relaxed">
              {currentItem.explanation}
            </p>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 pt-4 sm:pt-6">
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
      <p className="text-xs sm:text-sm text-dark-grey mt-4 sm:mt-6 opacity-75 text-center px-2">
        This may take a moment. Meanwhile, learn something new!
      </p>
    </div>
  );
};

export default LoadingScreen;
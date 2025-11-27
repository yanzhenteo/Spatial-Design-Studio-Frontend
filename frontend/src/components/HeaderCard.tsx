// src/components/HeaderCard.tsx
import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface HeaderCardProps {
  children: ReactNode;
  className?: string;
}

function HeaderCard({ children, className = "" }: HeaderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white rounded-2xl shadow-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md ${className}`}
    >
      <div className="text-center">
        {children}
      </div>
    </motion.div>
  );
}

export default HeaderCard;
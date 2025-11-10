// src/components/ContentCard.tsx
import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ContentCardProps {
  children: ReactNode;
  className?: string;
}

function ContentCard({ children, className = "" }: ContentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`bg-white rounded-2xl shadow-lg p-8 w-full ${className}`}
    >
      <div className="flex flex-col items-center justify-center space-y-6">
        {children}
      </div>
    </motion.div>
  );
}

export default ContentCard;
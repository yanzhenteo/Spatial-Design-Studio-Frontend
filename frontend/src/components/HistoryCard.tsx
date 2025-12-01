// src/components/HistoryCard.tsx
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface HistoryCardProps {
  date: Date;
  onClick: () => void;
  className?: string;
}

function HistoryCard({ date, onClick, className = "" }: HistoryCardProps) {
  // Format the date to be more readable
  const formattedDate = format(date, 'PPP'); // e.g., "January 1st, 2024"
  const shortDate = format(date, 'MMM d, yyyy'); // e.g., "Jan 1, 2024"
  const time = format(date, 'h:mm a'); // e.g., "2:30 PM"

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full bg-white rounded-xl shadow-md p-4 text-left transition-all duration-200 hover:shadow-lg hover:bg-light-blue ${className}`}
    >
      <div className="flex flex-col">
        {/* Date display */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-big-text text-dark-grey font-semibold">
              {formattedDate}
            </h3>
            <p className="text-fill-text text-muted-purple mt-1">
              {time}
            </p>
          </div>
          
          {/* Chevron icon indicating clickability */}
          <svg 
            className="w-5 h-5 text-muted-purple" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </div>
        
        {/* Preview content (placeholder for now) */}
        <div className="mt-2">
          <p className="text-fill-text text-dark-grey line-clamp-2">
            {/* This would be replaced with actual content preview */}
            Click to view details of this entry...
          </p>
        </div>
      </div>
    </motion.button>
  );
}

export default HistoryCard;
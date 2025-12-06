// src/components/HistoryCard.tsx
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface HistoryCardProps {
  date: Date;
  onClick: () => void;
  onDelete?: () => void;
  className?: string;
}

function HistoryCard({ date, onClick, onDelete, className = "" }: HistoryCardProps) {
  // Format the date to be more readable
  const formattedDate = format(date, 'PPP'); // e.g., "January 1st, 2024"
  const shortDate = format(date, 'MMM d, yyyy'); // e.g., "Jan 1, 2024"
  const time = format(date, 'h:mm a'); // e.g., "2:30 PM"

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`w-full bg-white rounded-xl shadow-md p-4 transition-all duration-200 hover:shadow-lg hover:bg-light-blue ${className}`}
    >
      <div className="flex flex-col">
        {/* Date display */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onClick}
            className="flex-1 text-left"
          >
            <h3 className="text-big-text text-dark-grey font-semibold">
              {formattedDate}
            </h3>
            <p className="text-fill-text text-muted-purple mt-1">
              {time}
            </p>
          </button>

          <div className="flex items-center gap-2 ml-2">
            {/* Delete button */}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-full hover:bg-red-100 transition-colors group"
                aria-label="Delete entry"
              >
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}

            {/* Chevron icon indicating clickability */}
            <button onClick={onClick} className="p-1">
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
            </button>
          </div>
        </div>
        
        {/* Preview content (placeholder for now) */}
        <button onClick={onClick} className="mt-2 w-full text-left">
          <p className="text-fill-text text-dark-grey line-clamp-2">
            {/* This would be replaced with actual content preview */}
            Click to view details of this entry...
          </p>
        </button>
      </div>
    </motion.div>
  );
}

export default HistoryCard;
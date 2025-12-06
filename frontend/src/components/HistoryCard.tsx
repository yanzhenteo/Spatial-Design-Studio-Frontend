// src/components/HistoryCard.tsx
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface HistoryCardProps {
  date: Date;
  onClick: () => void;
  onDelete?: () => void;
  previewImage?: string | null;
  className?: string;
}

function HistoryCard({ date, onClick, onDelete, previewImage, className = "" }: HistoryCardProps) {
  // Format the date to be more readable
  const formattedDate = format(date, 'PPP'); // e.g., "January 1st, 2024"
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
      onClick={onClick}
      className={`relative w-full h-32 rounded-xl shadow-md overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${className}`}
    >
      {/* Background Image */}
      {previewImage ? (
        <img
          src={previewImage}
          alt="Preview"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-linear-to-br from-light-blue to-light-purple" />
      )}

      {/* White overlay with fade effect - more opaque at bottom for text readability */}
      <div
        className="absolute inset-0 bg-white pointer-events-none"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0.95) 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0.95) 100%)'
        }}
      />

      {/* Content overlay */}
      <div className="relative h-full flex items-end justify-between p-4">
        {/* Left side - Date and time */}
        <div className="flex flex-col">
          <h3 className="text-big-text text-dark-grey font-semibold">
            {formattedDate}
          </h3>
          <p className="text-fill-text text-dark-grey mt-1">
            {time}
          </p>
        </div>

        {/* Right side - Delete button */}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-2 rounded-full hover:bg-white/50 transition-colors group z-10"
            aria-label="Delete entry"
          >
            <svg
              className="w-5 h-5 text-dark-grey group-hover:text-red-600"
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
      </div>
    </motion.div>
  );
}

export default HistoryCard;
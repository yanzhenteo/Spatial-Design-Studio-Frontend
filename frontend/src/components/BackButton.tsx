import React from 'react';

interface BackButtonProps {
  onBack: () => void;
  className?: string;
  text?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  onBack, 
  className = '', 
  text = 'Back to Home' 
}) => {
  return (
    <div className={`w-full max-w-md mb-6 ${className}`}>
      <button
        onClick={onBack}
        className="text-muted-purple text-button-text flex items-center gap-2 hover:opacity-80 transition-opacity duration-150"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {text}
      </button>
    </div>
  );
};

export default BackButton;
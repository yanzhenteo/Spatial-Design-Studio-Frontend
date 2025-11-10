// src/components/DoubleButton.tsx
import { type ReactNode } from 'react';

interface DoubleButtonProps {
  leftButton: {
    onClick: () => void;
    children: ReactNode;
    disabled?: boolean;
  };
  rightButton: {
    onClick: () => void;
    children: ReactNode;
    disabled?: boolean;
  };
  variant?: 'primary' | 'danger';
  className?: string;
}

function DoubleButton({ 
  leftButton, 
  rightButton, 
  variant = 'primary',
  className = "" 
}: DoubleButtonProps) {
  const colorClasses = {
    primary: {
      outline: 'border border-muted-purple text-muted-purple active:bg-muted-purple active:bg-opacity-10',
      filled: 'bg-muted-purple text-white active:bg-dark-purple'
    },
    danger: {
      outline: 'border border-red text-red active:bg-red active:bg-opacity-10',
      filled: 'bg-red text-white active:bg-red-700'
    }
  };

  const baseClasses = "py-3 rounded-lg text-button-text transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className={`flex w-full gap-3 ${className}`}>
      {/* Left Button - Outline */}
      <button
        type="button"
        onClick={leftButton.onClick}
        disabled={leftButton.disabled}
        className={`flex-1 ${baseClasses} ${colorClasses[variant].outline} bg-white`}
      >
        {leftButton.children}
      </button>
      
      {/* Right Button - Filled */}
      <button
        type="button"
        onClick={rightButton.onClick}
        disabled={rightButton.disabled}
        className={`flex-1 ${baseClasses} ${colorClasses[variant].filled}`}
      >
        {rightButton.children}
      </button>
    </div>
  );
}

export default DoubleButton;
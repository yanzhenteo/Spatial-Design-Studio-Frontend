// src/components/Button.tsx
import { type ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'danger';
}

function Button({ 
  children, 
  onClick, 
  type = 'button', 
  className = "", 
  disabled = false,
  variant = 'primary'
}: ButtonProps) {
  const baseClasses = "w-full py-3 rounded-lg text-button-text transition-transform duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-muted-purple text-white active:bg-dark-purple",
    danger: "bg-red text-white active:bg-red-700"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;
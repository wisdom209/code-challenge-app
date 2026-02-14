import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'font-display font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group';
  
  const variantStyles = {
    primary: 'bg-neon-cyan text-dark-950 hover:bg-neon-cyan/90 shadow-lg shadow-neon-cyan/20 hover:shadow-neon-cyan/40',
    secondary: 'bg-dark-700 text-neon-cyan border-2 border-neon-cyan hover:bg-dark-600 hover:shadow-lg hover:shadow-neon-cyan/20',
    danger: 'bg-neon-pink text-dark-950 hover:bg-neon-pink/90 shadow-lg shadow-neon-pink/20 hover:shadow-neon-pink/40',
    ghost: 'bg-transparent text-neon-cyan hover:bg-dark-700 border border-neon-cyan/30 hover:border-neon-cyan',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
    </button>
  );
};


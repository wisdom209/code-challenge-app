import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeStyles = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeStyles[size]} relative`}>
        <div className="absolute inset-0 border-4 border-dark-700 rounded-full" />
        <div className="absolute inset-0 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        <div className="absolute inset-2 border-4 border-neon-purple border-t-transparent rounded-full animate-spin animation-delay-150" style={{ animationDirection: 'reverse' }} />
      </div>
    </div>
  );
};


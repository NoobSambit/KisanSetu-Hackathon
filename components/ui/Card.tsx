/**
 * Card Component
 *
 * A reusable card component for displaying content in a contained box
 */

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  variant?: 'default' | 'glass' | 'outline';
}

function Card({
  children,
  className = '',
  hover = false,
  variant = 'default',
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-300';

  const variants = {
    default: 'bg-white shadow-sm border border-neutral-100',
    glass: 'glass shadow-lg',
    outline: 'bg-transparent border-2 border-dashed border-neutral-300',
  };

  const hoverStyles = hover
    ? 'hover:shadow-xl hover:shadow-primary-900/5 hover:-translate-y-1'
    : '';

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className} p-6`}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card };
export default Card;

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-xl font-bold text-neutral-900 leading-tight ${className}`}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`text-neutral-600 leading-relaxed ${className}`}>
      {children}
    </div>
  );
}

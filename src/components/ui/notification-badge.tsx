
import React from 'react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, className }) => {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        "absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium",
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

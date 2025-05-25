
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, className = '' }) => {
  if (count === 0) return null;

  return (
    <Badge 
      variant="destructive" 
      className={`ml-2 px-1.5 py-0.5 text-xs min-w-[1.25rem] h-5 rounded-full bg-red-500 text-white border-red-600 ${className}`}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
};

export default NotificationBadge;

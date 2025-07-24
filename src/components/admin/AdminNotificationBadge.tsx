import React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

const AdminNotificationBadge: React.FC = () => {
  const { isAdmin } = useUserRole();
  const { unreadCount } = useAdminNotifications();
  const navigate = useNavigate();

  if (!isAdmin || unreadCount === 0) {
    return null;
  }

  const handleClick = () => {
    navigate('/messages', { state: { showAdminNotifications: true } });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="relative p-2"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};

export default AdminNotificationBadge;
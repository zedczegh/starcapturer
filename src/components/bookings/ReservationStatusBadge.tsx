
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import { isAfter, parseISO } from 'date-fns';

interface ReservationStatusBadgeProps {
  status: string;
  endTime: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
}

const ReservationStatusBadge: React.FC<ReservationStatusBadgeProps> = ({
  status,
  endTime,
  checkedInAt,
  checkedOutAt
}) => {
  const { t } = useLanguage();
  
  // Check if reservation is past due
  const isPastDue = isAfter(new Date(), parseISO(endTime));
  
  if (isPastDue && status !== 'checked_out') {
    return (
      <Badge variant="destructive" className="bg-red-600/20 text-red-400 border-red-600/30">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {t('Expired', '已过期')}
      </Badge>
    );
  }
  
  switch (status) {
    case 'confirmed':
      return (
        <Badge variant="default" className="bg-blue-600/20 text-blue-400 border-blue-600/30">
          <Clock className="h-3 w-3 mr-1" />
          {t('Confirmed', '已确认')}
        </Badge>
      );
    case 'checked_in':
      return (
        <Badge variant="default" className="bg-green-600/20 text-green-400 border-green-600/30">
          <LogIn className="h-3 w-3 mr-1" />
          {t('Checked In', '已签到')}
        </Badge>
      );
    case 'checked_out':
      return (
        <Badge variant="default" className="bg-gray-600/20 text-gray-400 border-gray-600/30">
          <LogOut className="h-3 w-3 mr-1" />
          {t('Checked Out', '已退房')}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="border-cosmic-600/30 text-gray-400">
          {status}
        </Badge>
      );
  }
};

export default ReservationStatusBadge;

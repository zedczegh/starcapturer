
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, LogOut, AlertTriangle } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';

interface ReservationTimestampsProps {
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  hostNotes?: string | null;
  endTime: string;
  status: string;
}

const ReservationTimestamps: React.FC<ReservationTimestampsProps> = ({
  checkedInAt,
  checkedOutAt,
  hostNotes,
  endTime,
  status
}) => {
  const { t } = useLanguage();
  const isPastDue = isAfter(new Date(), parseISO(endTime));
  
  return (
    <div className="text-xs text-gray-500 space-y-1">
      {checkedInAt && (
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-400" />
          <span>
            {t('Checked in:', '签到时间:')} {format(new Date(checkedInAt), 'MMM d, yyyy HH:mm')}
          </span>
        </div>
      )}
      {checkedOutAt && (
        <div className="flex items-center gap-1">
          <LogOut className="h-3 w-3 text-orange-400" />
          <span>
            {t('Checked out:', '退房时间:')} {format(new Date(checkedOutAt), 'MMM d, yyyy HH:mm')}
          </span>
        </div>
      )}
      {isPastDue && status !== 'checked_out' && (
        <div className="flex items-center gap-1 text-red-400">
          <AlertTriangle className="h-3 w-3" />
          <span>
            {t('This reservation has expired', '此预订已过期')}
          </span>
        </div>
      )}
      {hostNotes && (
        <div className="text-gray-400 text-xs">
          <span className="font-medium">{t('Host Notes:', '主人备注:')}</span> {hostNotes}
        </div>
      )}
    </div>
  );
};

export default ReservationTimestamps;

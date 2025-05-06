
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, parseISO } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Users, DollarSign, Edit, Trash2, User as UserIcon } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getInitials } from '@/utils/stringUtils';

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  description: string;
  price: number;
  currency: string;
  astro_spot_reservations: {
    id: string;
    user_id: string;
    status: string;
    profiles?: {
      username?: string;
      avatar_url?: string;
    };
  }[];
}

interface TimeSlotItemProps {
  timeSlot: TimeSlot;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const TimeSlotItem: React.FC<TimeSlotItemProps> = ({ 
  timeSlot, 
  isOwner,
  onEdit,
  onDelete
}) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { confirmDialog } = useModal();
  
  const startTime = parseISO(timeSlot.start_time);
  const endTime = parseISO(timeSlot.end_time);
  
  const locale = language === 'zh' ? zhCN : enUS;
  
  const formatTimeRange = () => {
    const dateStr = format(startTime, 'PPP', { locale });
    const startStr = format(startTime, 'p', { locale });
    const endStr = format(endTime, 'p', { locale });
    return `${dateStr}, ${startStr} - ${endStr}`;
  };
  
  const confirmedReservations = timeSlot.astro_spot_reservations.filter(r => r.status === 'confirmed');
  const isFullyBooked = confirmedReservations.length >= timeSlot.max_capacity;
  const hasUserBooked = user && timeSlot.astro_spot_reservations.some(r => r.user_id === user.id);
  
  const handleReservation = async () => {
    try {
      if (!user) {
        toast.error(t('Please sign in to make a reservation', '请登录以进行预订'));
        return;
      }
      
      if (isFullyBooked) {
        toast.error(t('This time slot is fully booked', '此时段已预订满'));
        return;
      }
      
      if (hasUserBooked) {
        toast.error(t('You have already booked this time slot', '您已预订此时段'));
        return;
      }
      
      const { data, error } = await supabase.rpc('insert_astro_spot_reservation', {
        p_timeslot_id: timeSlot.id,
        p_user_id: user.id
      });
      
      if (error) throw error;
      
      toast.success(t('Reservation successful', '预订成功'));
      // Refresh the page to show updated reservation status
      window.location.reload();
    } catch (error: any) {
      console.error('Error making reservation:', error);
      toast.error(error.message || t('Failed to make reservation', '预订失败'));
    }
  };

  const handleDeleteConfirm = () => {
    confirmDialog({
      title: t('Delete Time Slot', '删除时段'),
      description: t('Are you sure you want to delete this time slot? This action cannot be undone.', 
                     '您确定要删除此时段吗？此操作无法撤消。'),
      onConfirm: onDelete
    });
  };
  
  return (
    <Card className="bg-cosmic-900/70 border-cosmic-700/50 hover:border-cosmic-600/50 transition-all">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h4 className="font-medium text-cosmic-100">
                {formatTimeRange()}
              </h4>
              
              {timeSlot.description && (
                <p className="text-sm text-cosmic-300">{timeSlot.description}</p>
              )}
            </div>
            
            <div>
              {timeSlot.price > 0 ? (
                <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-700/50">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {timeSlot.price} {timeSlot.currency}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-700/50">
                  {t('Free', '免费')}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-cosmic-400">
            <Clock className="h-4 w-4" />
            <span>
              {format(endTime, 'HH:mm') === '23:59' 
                ? t('Full day', '全天') 
                : t('Duration: {{hours}}h {{minutes}}m', '时长：{{hours}}小时 {{minutes}}分钟')
                    .replace('{{hours}}', String(Math.floor((endTime.getTime() - startTime.getTime()) / 3600000)))
                    .replace('{{minutes}}', String(Math.floor(((endTime.getTime() - startTime.getTime()) % 3600000) / 60000)))
              }
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-cosmic-400" />
              <span className="text-sm text-cosmic-400">
                {confirmedReservations.length}/{timeSlot.max_capacity} {t('booked', '已预订')}
              </span>
              
              {confirmedReservations.length > 0 && (
                <div className="flex -space-x-2 ml-2">
                  {confirmedReservations.slice(0, 3).map((reservation) => (
                    <Avatar key={reservation.id} className="h-6 w-6 border border-cosmic-800">
                      {reservation.profiles?.avatar_url ? (
                        <AvatarImage src={reservation.profiles.avatar_url} alt={reservation.profiles.username || ''} />
                      ) : (
                        <AvatarFallback className="bg-cosmic-700 text-xs">
                          {getInitials(reservation.profiles?.username || "User")}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  ))}
                  {confirmedReservations.length > 3 && (
                    <Avatar className="h-6 w-6 border border-cosmic-800 bg-cosmic-700">
                      <AvatarFallback className="text-xs">
                        +{confirmedReservations.length - 3}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              {isOwner && (
                <>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    className="h-8 px-2 text-cosmic-400 border-cosmic-700/50 hover:bg-cosmic-800/50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteConfirm}
                    className="h-8 px-2 text-red-400 border-cosmic-700/50 hover:bg-cosmic-800/50 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {!isOwner && !hasUserBooked && (
                <Button
                  size="sm"
                  onClick={handleReservation}
                  disabled={isFullyBooked}
                  className={isFullyBooked 
                    ? "bg-cosmic-700 text-cosmic-400" 
                    : "bg-primary hover:bg-primary/80"}
                >
                  {isFullyBooked 
                    ? t('Fully Booked', '已预订满') 
                    : t('Book Now', '立即预订')}
                </Button>
              )}
              
              {!isOwner && hasUserBooked && (
                <Badge className="bg-green-800/40 text-green-300 border-green-700/50">
                  {t('Booked', '已预订')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeSlotItem;

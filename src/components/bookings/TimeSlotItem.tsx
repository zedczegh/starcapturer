
import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModal } from '@/contexts/ModalContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, Clock, Calendar, DollarSign, Trash2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  username: string | null;
  avatar_url: string | null;
}

interface Reservation {
  id: string;
  user_id: string;
  status: string;
  profiles?: Profile;
}

interface TimeSlot {
  id: string;
  spot_id: string;
  creator_id: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  description: string | null;
  price: number | null;
  currency: string | null;
  astro_spot_reservations: Reservation[];
}

interface TimeSlotItemProps {
  timeSlot: TimeSlot;
  isCreator: boolean;
  onUpdate: () => void;
  onBook: () => void;
}

const TimeSlotItem: React.FC<TimeSlotItemProps> = ({ 
  timeSlot, 
  isCreator,
  onUpdate,
  onBook
}) => {
  const { t } = useLanguage();
  const { openModal } = useModal();
  
  const startTime = new Date(timeSlot.start_time);
  const endTime = new Date(timeSlot.end_time);
  
  const reservations = timeSlot.astro_spot_reservations || [];
  const reservationCount = reservations.length;
  const spotsFilled = `${reservationCount}/${timeSlot.max_capacity}`;
  const isFull = reservationCount >= timeSlot.max_capacity;
  
  const handleDelete = () => {
    openModal('confirmation', {
      title: t('Delete Time Slot', '删除时间段'),
      description: t(
        'Are you sure you want to delete this time slot? All reservations will be cancelled.',
        '您确定要删除此时间段吗？所有预订都将被取消。'
      ),
      confirmText: t('Delete', '删除'),
      cancelText: t('Cancel', '取消'),
      onConfirm: async () => {
        try {
          // Delete all reservations first
          await supabase
            .from('astro_spot_reservations')
            .delete()
            .eq('timeslot_id', timeSlot.id);
            
          // Then delete the time slot
          const { error } = await supabase
            .from('astro_spot_timeslots')
            .delete()
            .eq('id', timeSlot.id);
            
          if (error) throw error;
          
          toast.success(t('Time slot deleted successfully', '时间段删除成功'));
          onUpdate();
        } catch (error: any) {
          toast.error(error.message || t('Failed to delete time slot', '删除时间段失败'));
        }
      }
    });
  };
  
  return (
    <div className="bg-cosmic-800/50 rounded-lg border border-cosmic-700/30 p-4 backdrop-blur-sm">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-cosmic-300" />
              <span className="text-cosmic-100">
                {format(startTime, 'PPP')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-cosmic-300" />
              <span className="text-cosmic-100">
                {`${format(startTime, 'p')} - ${format(endTime, 'p')}`}
              </span>
            </div>
            {timeSlot.price && timeSlot.price > 0 && (
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-cosmic-300" />
                <span className="text-cosmic-100">
                  {`${timeSlot.currency || '$'}${timeSlot.price}`}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-cosmic-300" />
              <span className={`text-sm ${isFull ? 'text-red-400' : 'text-cosmic-300'}`}>
                {spotsFilled}
              </span>
            </div>
            
            {isCreator ? (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDelete}
                className="h-8"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t("Delete", "删除")}
              </Button>
            ) : (
              <Button 
                variant="default"
                size="sm"
                onClick={onBook}
                disabled={isFull}
                className="h-8 bg-primary hover:bg-primary/90"
              >
                <Check className="h-4 w-4 mr-1" />
                {t("Book", "预订")}
              </Button>
            )}
          </div>
        </div>
        
        {timeSlot.description && (
          <p className="text-sm text-cosmic-300 mt-2">
            {timeSlot.description}
          </p>
        )}
        
        {/* Reservation list */}
        {reservations.length > 0 && isCreator && (
          <div className="mt-3 space-y-2">
            <h4 className="text-sm font-medium text-cosmic-200">
              {t("Reservations", "预订")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {reservations.map((reservation) => (
                <div 
                  key={reservation.id}
                  className="flex items-center gap-2 bg-cosmic-900/70 rounded-full px-3 py-1.5"
                >
                  <Avatar className="h-6 w-6">
                    {reservation.profiles?.avatar_url ? (
                      <AvatarImage 
                        src={reservation.profiles.avatar_url} 
                        alt={reservation.profiles.username || 'User'} 
                      />
                    ) : (
                      <AvatarFallback className="bg-cosmic-700 text-xs">
                        {reservation.profiles?.username?.substring(0, 2).toUpperCase() || '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-sm text-cosmic-200">
                    {reservation.profiles?.username || t("Unknown User", "未知用户")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotItem;

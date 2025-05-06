
import React from 'react';
import { format } from 'date-fns';
import { 
  CalendarClock, 
  Clock, 
  Users, 
  Trash2, 
  UserPlus, 
  CreditCard,
  Edit 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModal } from '@/contexts/ModalContext';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  description?: string;
  price?: number;
  currency?: string;
  astro_spot_reservations?: {
    id: string;
    user_id: string;
    status: string;
    profiles?: {
      username: string | null;
      avatar_url: string | null;
    };
  }[];
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
  const { user } = useAuth();

  const startTime = new Date(timeSlot.start_time);
  const endTime = new Date(timeSlot.end_time);
  
  const reservations = timeSlot.astro_spot_reservations || [];
  const reservationCount = reservations.length;
  const isFull = reservationCount >= timeSlot.max_capacity;
  const userHasReserved = user ? reservations.some(r => r.user_id === user.id) : false;

  const formatTimeRange = () => {
    return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
  };

  const handleDelete = async () => {
    openModal('confirmation', {
      title: t("Delete Time Slot", "删除时间段"),
      description: t("Are you sure you want to delete this time slot? This action cannot be undone.", 
                    "确定要删除此时间段吗？此操作无法撤销。"),
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('astro_spot_timeslots')
            .delete()
            .eq('id', timeSlot.id);
            
          if (error) throw error;
          
          toast.success(t("Time slot deleted successfully", "时间段删除成功"));
          onUpdate();
        } catch (error: any) {
          toast.error(error.message || t("Failed to delete time slot", "删除时间段失败"));
        }
      }
    });
  };

  const handleBookRequest = () => {
    if (!user) {
      toast.error(t("You need to be logged in to book a time slot", "您需要登录才能预订时间段"));
      return;
    }

    openModal('confirmation', {
      title: t("Book Time Slot", "预订时间段"),
      description: t("Would you like to book this time slot?", "您想预订此时间段吗？"),
      onConfirm: onBook
    });
  };

  return (
    <div className="bg-cosmic-800/40 border border-cosmic-700/40 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="h-4 w-4 text-primary" />
            <span className="text-cosmic-100 font-medium">
              {format(startTime, 'EEEE, MMMM do')}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-cosmic-200">
              {formatTimeRange()}
            </span>
          </div>
          
          {timeSlot.description && (
            <p className="text-cosmic-300 text-sm mb-2">
              {timeSlot.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
            <div className="flex items-center gap-1 text-xs text-cosmic-300">
              <Users className="h-3.5 w-3.5" />
              <span>
                {t(`${reservationCount}/${timeSlot.max_capacity} booked`, 
                   `${reservationCount}/${timeSlot.max_capacity} 已预订`)}
              </span>
            </div>
            
            {timeSlot.price !== undefined && timeSlot.price > 0 && (
              <div className="flex items-center gap-1 text-xs text-cosmic-300">
                <CreditCard className="h-3.5 w-3.5" />
                <span>
                  {`${timeSlot.currency || '$'}${timeSlot.price}`}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          {isCreator ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDelete} 
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {t("Delete", "删除")}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                {t("Edit", "编辑")}
              </Button>
            </>
          ) : (
            <Button
              variant={userHasReserved ? "ghost" : "default"}
              size="sm"
              onClick={handleBookRequest}
              disabled={isFull || userHasReserved}
              className={
                userHasReserved 
                  ? "bg-emerald-500/20 text-emerald-300 cursor-default" 
                  : isFull 
                    ? "bg-cosmic-700/50 text-cosmic-300 cursor-not-allowed" 
                    : "bg-primary hover:bg-primary/90"
              }
            >
              {userHasReserved ? (
                <>
                  <Users className="h-3.5 w-3.5 mr-1" />
                  {t("Booked", "已预订")}
                </>
              ) : isFull ? (
                t("Fully Booked", "已满")
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  {t("Book Now", "立即预订")}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      {/* Show attendee list for creator */}
      {isCreator && reservations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-cosmic-700/30">
          <p className="text-xs text-cosmic-300 mb-2">
            {t("Attendees", "参与者")}:
          </p>
          <div className="flex flex-wrap gap-2">
            {reservations.map(reservation => (
              <div key={reservation.id} className="flex items-center gap-1.5 bg-cosmic-700/30 rounded-full py-1 px-2">
                <Avatar className="h-5 w-5">
                  {reservation.profiles?.avatar_url ? (
                    <AvatarImage 
                      src={reservation.profiles.avatar_url} 
                      alt={reservation.profiles.username || "User"} 
                    />
                  ) : (
                    <AvatarFallback className="text-[10px]">
                      {reservation.profiles?.username?.[0] || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-xs text-cosmic-200">
                  {reservation.profiles?.username || t("User", "用户")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotItem;


import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { format, isAfter, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Calendar, Users, Clock, Edit, Trash2, MapPin, MessageCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TimeSlotForm from './TimeSlotForm';
import { formatDateRanges } from '@/utils/dateRangeUtils';
import DateRangePicker from './DateRangePicker';
import GuestSelector from './GuestSelector';
import PriceCalculator from './PriceCalculator';
import { formatCurrency } from '@/utils/currencyUtils';

interface TimeSlotItemProps {
  timeSlot: any;
  isCreator: boolean;
  onUpdate: () => void;
  group?: any[];
}

const TimeSlotItem: React.FC<TimeSlotItemProps> = ({ 
  timeSlot, 
  isCreator, 
  onUpdate,
  group = [timeSlot]
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [guestCounts, setGuestCounts] = useState<Record<string, number>>({ adults: 1 });

  // Check if the time slot is in the past
  const isPastDue = isAfter(new Date(), parseISO(timeSlot.end_time));
  
  // Get available dates for booking (exclude past dates)
  const availableDates = group.filter(slot => 
    !isAfter(new Date(), parseISO(slot.start_time))
  );

  const deleteTimeSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('astro_spot_timeslots')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSlots'] });
      toast.success(t("Time slot deleted successfully", "时间段删除成功"));
      onUpdate();
    },
    onError: (error) => {
      console.error('Error deleting time slot:', error);
      toast.error(t("Failed to delete time slot", "删除时间段失败"));
    }
  });

  const bookTimeSlotMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !startDate) throw new Error('User not authenticated or no start date selected');
      
      // Calculate the dates to book
      const datesToBook = [];
      let currentDate = new Date(startDate);
      const bookingEndDate = endDate || startDate;
      
      while (currentDate <= bookingEndDate) {
        const slot = group.find(s => 
          format(new Date(s.start_time), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
        );
        
        if (slot) {
          const { data, error } = await supabase.functions.invoke('call-rpc', {
            body: {
              function: 'insert_astro_spot_reservation',
              params: {
                p_timeslot_id: slot.id,
                p_user_id: user.id,
                p_status: 'confirmed'
              }
            }
          });

          if (error) throw error;
          datesToBook.push(data);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return datesToBook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSlots'] });
      toast.success(t("Booking confirmed!", "预订确认！"));
      setShowBookingDialog(false);
      setStartDate(null);
      setEndDate(null);
    },
    onError: (error: any) => {
      console.error('Error booking time slot:', error);
      toast.error(error.message || t("Booking failed", "预订失败"));
    }
  });

  const handleContactHost = () => {
    if (timeSlot.astro_spot_reservations?.[0]?.profiles?.username) {
      navigate('/messages', { 
        state: { 
          selectedUserId: timeSlot.creator_id,
          selectedUsername: timeSlot.astro_spot_reservations[0].profiles.username
        }
      });
    }
  };

  const handleBooking = () => {
    if (!startDate) {
      toast.error(t("Please select at least a start date", "请至少选择一个开始日期"));
      return;
    }
    
    if (timeSlot.is_free) {
      // For free bookings, book directly
      bookTimeSlotMutation.mutate();
    } else {
      // For paid bookings, this would integrate with payment system
      toast.info(t("Payment integration coming soon", "支付集成即将推出"));
    }
  };

  const calculateNumberOfNights = () => {
    if (!startDate || !endDate) return 1;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  if (isEditing) {
    return (
      <TimeSlotForm
        spotId={timeSlot.spot_id}
        existingTimeSlot={timeSlot}
        onSuccess={() => {
          setIsEditing(false);
          onUpdate();
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  const reservations = timeSlot.astro_spot_reservations || [];
  const dateRanges = formatDateRanges(group);

  return (
    <div className="bg-cosmic-800/40 border border-cosmic-700/30 rounded-lg p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-400" />
            <span className="text-gray-200 font-medium">
              {dateRanges}
            </span>
            {isPastDue && (
              <Badge variant="destructive" className="text-xs">
                {t('Expired', '已过期')}
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-2">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {format(new Date(timeSlot.start_time), 'HH:mm')} - 
                {format(new Date(timeSlot.end_time), 'HH:mm')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>
                {t('Max', '最大')} {timeSlot.max_capacity} {t('guests', '客人')}
              </span>
            </div>
          </div>

          {/* Pricing Display */}
          <div className="mb-2">
            {timeSlot.is_free ? (
              <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                {t('Free', '免费')}
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-200">
                  {formatCurrency(parseFloat(timeSlot.price) || 0, timeSlot.currency)} 
                  <span className="text-sm text-gray-400 ml-1">
                    / {t('night', '晚')}
                  </span>
                </span>
              </div>
            )}
          </div>

          {timeSlot.description && (
            <p className="text-gray-300 text-sm mb-2">{timeSlot.description}</p>
          )}

          {reservations.length > 0 && (
            <div className="text-xs text-gray-400">
              <span className="font-medium">{t('Booked by:', '预订者:')}</span>
              {reservations.map((reservation: any, index: number) => (
                <span key={reservation.id} className="ml-1">
                  {reservation.profiles?.username || t('Unknown', '未知')}
                  {index < reservations.length - 1 && ', '}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {isCreator ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="bg-cosmic-700/50 border-cosmic-600/50 hover:bg-cosmic-600/50"
                disabled={isPastDue}
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('Edit', '编辑')}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-red-600/20 border-red-600/30 text-red-400 hover:bg-red-600/30"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('Delete', '删除')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-cosmic-800 border-cosmic-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-gray-100">
                      {t('Delete Time Slot', '删除时间段')}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      {t('Are you sure you want to delete this time slot? This action cannot be undone.', 
                         '您确定要删除此时间段吗？此操作无法撤销。')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-cosmic-700 border-cosmic-600 text-gray-300 hover:bg-cosmic-600">
                      {t('Cancel', '取消')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteTimeSlotMutation.mutate(timeSlot.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {t('Delete', '删除')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            !isPastDue && availableDates.length > 0 && (
              <>
                <Button
                  size="sm"
                  onClick={() => setShowBookingDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Star className="h-4 w-4 mr-2" />
                  {timeSlot.is_free ? t('Book Free', '免费预订') : t('Book Now', '立即预订')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleContactHost}
                  className="bg-cosmic-700/50 border-cosmic-600/50 hover:bg-cosmic-600/50"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t('Contact Host', '联系主人')}
                </Button>
              </>
            )
          )}
        </div>
      </div>

      {/* Booking Dialog */}
      <AlertDialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <AlertDialogContent className="bg-cosmic-800 border-cosmic-700 max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-100">
              {timeSlot.is_free ? t('Book Free Time Slot', '预订免费时段') : t('Book Time Slot', '预订时段')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {t('Select your preferred dates and number of guests.', '选择您的首选日期和客人数量。')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
            
            <GuestSelector
              onChange={setGuestCounts}
              maxGuests={timeSlot.max_capacity}
            />

            {startDate && (
              <PriceCalculator
                pricePerNight={parseFloat(timeSlot.price) || 0}
                currency={timeSlot.currency || 'USD'}
                numberOfNights={calculateNumberOfNights()}
                isFree={timeSlot.is_free}
              />
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-cosmic-700 border-cosmic-600 text-gray-300 hover:bg-cosmic-600">
              {t('Cancel', '取消')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBooking}
              disabled={!startDate || bookTimeSlotMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {bookTimeSlotMutation.isPending 
                ? t('Booking...', '预订中...') 
                : timeSlot.is_free 
                  ? t('Book Free', '免费预订')
                  : t('Book & Pay', '预订并支付')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimeSlotItem;

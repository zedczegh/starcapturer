
import React, { useState } from 'react';
import { format, parseISO, isAfter, addDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDateForLanguage } from '@/utils/dateFormatting';
import { formatDateRangeWithNights } from '@/utils/dateRangeUtils';
import GuestSelector from './GuestSelector';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface TimeSlotItemProps {
  timeSlot: any;
  isCreator: boolean;
  onUpdate: () => void;
  group?: any[]; // Group of consecutive time slots
}

const TimeSlotItem: React.FC<TimeSlotItemProps> = ({ timeSlot, isCreator, onUpdate, group = [] }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [guests, setGuests] = useState<Record<string, number>>({
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0
  });
  
  // Check-in/check-out date state
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(undefined);
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(undefined);
  
  // Get full time slot group (if provided) or default to single time slot
  const fullGroup = group.length > 0 ? group : [timeSlot];
  
  // Get the first and last dates from the group
  const firstDate = new Date(fullGroup[0].start_time);
  const lastDate = new Date(fullGroup[fullGroup.length - 1].start_time);
  
  // Calculate the available date range for this time slot
  const availableDates = fullGroup.map(slot => new Date(slot.start_time));
  
  // Check if user has already booked this slot
  const hasUserBooked = timeSlot.astro_spot_reservations?.some(
    (res: any) => res.user_id === user?.id
  );

  // Format date range for display
  const formattedDateRange = formatDateRangeWithNights(firstDate, lastDate);
  
  // Format times without dates
  const startTime = format(parseISO(timeSlot.start_time), 'HH:mm');
  const endTime = format(parseISO(timeSlot.end_time), 'HH:mm');
  
  // Calculate available slots
  const totalBookings = timeSlot.astro_spot_reservations?.length || 0;
  const availableSlots = timeSlot.max_capacity - totalBookings;

  // Function to send automatic message to host
  const sendAutoMessageToHost = async (spotName: string, hostUserId: string, checkInFormatted: string, checkOutFormatted: string) => {
    try {
      const message = `Hello! I've made a reservation at your astrospot: ${spotName} from ${checkInFormatted} to ${checkOutFormatted}, please contact me further! Thank you!`;
      
      const { error } = await supabase.from('user_messages').insert({
        sender_id: user!.id,
        receiver_id: hostUserId,
        message: message,
      });

      if (error) {
        console.error('Error sending auto-message to host:', error);
      } else {
        console.log('Auto-message sent to host successfully');
      }
    } catch (error) {
      console.error('Error in sendAutoMessageToHost:', error);
    }
  };

  const handleDelete = async () => {
    if (!isCreator) return;
    
    try {
      setIsDeleting(true);
      
      // Delete each time slot in the group
      for (const slot of fullGroup) {
        const { error } = await supabase
          .from('astro_spot_timeslots')
          .delete()
          .eq('id', slot.id);
        
        if (error) throw error;
      }
      
      toast.success(t('Time slot deleted', '时间段已删除'));
      onUpdate();
    } catch (error) {
      console.error('Error deleting time slot:', error);
      toast.error(t('Failed to delete time slot', '删除时间段失败'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error(t('Please sign in to book', '请登录后预订'));
      return;
    }
    
    if (hasUserBooked) {
      toast.error(t('You have already booked this time slot', '您已经预订了此时间段'));
      return;
    }
    
    // Validate check-in/check-out dates
    if (!checkInDate || !checkOutDate) {
      toast.error(t('Please select check-in and check-out dates', '请选择入住和退房日期'));
      return;
    }
    
    try {
      setIsBooking(true);
      
      // Find the time slots that match the selected date range
      const selectedTimeSlots = fullGroup.filter(slot => {
        const slotDate = new Date(slot.start_time);
        return slotDate >= checkInDate && slotDate <= checkOutDate;
      });
      
      if (selectedTimeSlots.length === 0) {
        throw new Error(t('No available time slots in the selected date range', '所选日期范围内没有可用的时间段'));
      }
      
      // Book each time slot in the selected range
      for (const slot of selectedTimeSlots) {
        // Call the RPC function to insert a reservation
        const { data, error } = await supabase.functions.invoke('call-rpc', {
          body: {
            function: 'insert_astro_spot_reservation',
            params: {
              p_timeslot_id: slot.id,
              p_user_id: user.id,
            }
          }
        });
        
        if (error) throw error;
      }

      // Get spot details for the auto-message
      const { data: spotData, error: spotError } = await supabase
        .from('user_astro_spots')
        .select('name, user_id')
        .eq('id', timeSlot.spot_id)
        .single();

      if (!spotError && spotData) {
        const checkInFormatted = format(checkInDate, 'MMM d, yyyy');
        const checkOutFormatted = format(checkOutDate, 'MMM d, yyyy');
        
        // Send auto-message to host
        await sendAutoMessageToHost(
          spotData.name,
          spotData.user_id,
          checkInFormatted,
          checkOutFormatted
        );
      }
      
      toast.success(t('Booking confirmed', '预订已确认'));
      onUpdate();
      setShowBookingForm(false);
      setCheckInDate(undefined);
      setCheckOutDate(undefined);
    } catch (error: any) {
      console.error('Error booking time slot:', error);
      toast.error(error.message || t('Failed to book time slot', '预订时间段失败'));
    } finally {
      setIsBooking(false);
    }
  };

  const handleGuestChange = (guestCounts: Record<string, number>) => {
    setGuests(guestCounts);
  };

  const isDateAvailable = (date: Date) => {
    // Check if the date is in the available dates
    return availableDates.some(availableDate => 
      availableDate.getFullYear() === date.getFullYear() &&
      availableDate.getMonth() === date.getMonth() &&
      availableDate.getDate() === date.getDate()
    );
  };

  return (
    <div className="bg-cosmic-800/40 border border-cosmic-700/30 rounded-lg p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
        <div className="text-gray-200 font-medium mb-2 sm:mb-0">
          {formattedDateRange}, {startTime}-{endTime}
        </div>
        <div className="flex space-x-2">
          {!isCreator && !hasUserBooked && !showBookingForm && (
            <Button
              variant="outline"
              onClick={() => setShowBookingForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t('Book', '预订')}
            </Button>
          )}
          
          {isCreator && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600/40 hover:bg-red-700/60"
            >
              {isDeleting ? t('Deleting...', '删除中...') : t('Delete', '删除')}
            </Button>
          )}
          
          {hasUserBooked && (
            <div className="text-green-500 font-medium px-3 py-1.5 bg-green-500/20 rounded-md">
              {t('Booked', '已预订')}
            </div>
          )}
        </div>
      </div>
      
      {timeSlot.description && (
        <p className="text-gray-300 text-sm mb-2">{timeSlot.description}</p>
      )}
      
      <div className="flex flex-wrap gap-2 text-sm text-gray-400">
        <div>
          {t('Price', '价格')}: {timeSlot.price > 0 
            ? `${timeSlot.currency}${timeSlot.price}` 
            : t('Free', '免费')}
        </div>
        <div className="mx-2">•</div>
        <div>
          {t('Available', '可用')}: {availableSlots} / {timeSlot.max_capacity}
        </div>
        {timeSlot.pets_policy && (
          <>
            <div className="mx-2">•</div>
            <div>{t('Pets', '宠物')}: {
              timeSlot.pets_policy === 'not_allowed' ? t('Not Allowed', '不允许') :
              timeSlot.pets_policy === 'allowed' ? t('Allowed', '允许') :
              timeSlot.pets_policy === 'only_small' ? t('Only Small Pets', '仅小型宠物') :
              timeSlot.pets_policy === 'approval_required' ? t('Host Approval Required', '需要主人批准') :
              timeSlot.pets_policy
            }</div>
          </>
        )}
        <div className="mx-2">•</div>
        <div>
          {t('Total nights', '总晚数')}: {fullGroup.length}
        </div>
      </div>
      
      {showBookingForm && !hasUserBooked && (
        <div className="mt-4 p-3 bg-cosmic-900/40 border border-cosmic-700/30 rounded-md">
          <h4 className="text-gray-200 font-medium mb-3">{t('Booking Details', '预订详情')}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                {t('Select check-in and check-out dates', '选择入住和退房日期')}
              </label>
              
              <div className="bg-cosmic-800/70 rounded-lg p-2">
                <Calendar
                  mode="range"
                  selected={{ 
                    from: checkInDate, 
                    to: checkOutDate 
                  }}
                  onSelect={(range) => {
                    if (range?.from) setCheckInDate(range.from);
                    if (range?.to) setCheckOutDate(range.to);
                  }}
                  disabled={(date) => {
                    // Disable dates that are not in the available dates list
                    return !isDateAvailable(date);
                  }}
                  className="bg-cosmic-800/30 border-cosmic-700/30 rounded-lg"
                />
              </div>
              
              <div className="text-sm text-gray-400 mt-2">
                {checkInDate && checkOutDate ? (
                  <span>
                    {format(checkInDate, 'MMM d')} - {format(checkOutDate, 'MMM d')} 
                    ({Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))} {t('nights', '晚')})
                  </span>
                ) : (
                  <span>{t('Please select your dates', '请选择您的日期')}</span>
                )}
              </div>
            </div>
            
            <div>
              <GuestSelector 
                onChange={handleGuestChange} 
                maxGuests={timeSlot.max_capacity}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline"
              onClick={() => setShowBookingForm(false)}
              className="bg-cosmic-700/50"
            >
              {t('Cancel', '取消')}
            </Button>
            <Button
              onClick={handleBooking}
              disabled={isBooking}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isBooking 
                ? t('Confirming...', '确认中...') 
                : t('Confirm Booking', '确认预订')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotItem;

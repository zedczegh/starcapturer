
import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDateForLanguage } from '@/utils/dateFormatting';
import GuestSelector from './GuestSelector';

interface TimeSlotItemProps {
  timeSlot: any;
  isCreator: boolean;
  onUpdate: () => void;
}

const TimeSlotItem: React.FC<TimeSlotItemProps> = ({ timeSlot, isCreator, onUpdate }) => {
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
  
  // Check if user has already booked this slot
  const hasUserBooked = timeSlot.astro_spot_reservations?.some(
    (res: any) => res.user_id === user?.id
  );

  // Format dates for display
  const formattedStartDate = formatDateForLanguage(timeSlot.start_time, language);
  const formattedEndDate = formatDateForLanguage(timeSlot.end_time, language);
  
  // Format times without dates
  const startTime = format(parseISO(timeSlot.start_time), 'HH:mm');
  const endTime = format(parseISO(timeSlot.end_time), 'HH:mm');
  
  // Calculate available slots
  const totalBookings = timeSlot.astro_spot_reservations?.length || 0;
  const availableSlots = timeSlot.max_capacity - totalBookings;

  const handleDelete = async () => {
    if (!isCreator) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('astro_spot_timeslots')
        .delete()
        .eq('id', timeSlot.id);
      
      if (error) throw error;
      
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
    
    try {
      setIsBooking(true);
      
      // Call the RPC function to insert a reservation
      const { data, error } = await supabase.rpc('insert_astro_spot_reservation', {
        p_timeslot_id: timeSlot.id,
        p_user_id: user.id,
        // Store guest information as a JSON string in the metadata field
        p_metadata: JSON.stringify(guests)
      });
      
      if (error) throw error;
      
      toast.success(t('Booking confirmed', '预订已确认'));
      onUpdate();
      setShowBookingForm(false);
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

  // Format price display
  const priceDisplay = () => {
    if (!timeSlot.price || timeSlot.price <= 0) {
      return t('Free', '免费');
    }
    return `${timeSlot.currency || '$'}${timeSlot.price}`;
  };

  return (
    <div className="bg-cosmic-800/40 border border-cosmic-700/30 rounded-lg p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
        <div className="text-gray-200 font-medium mb-2 sm:mb-0">
          {formattedStartDate} {startTime} - {endTime}
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
          {t('Price', '价格')}: {priceDisplay()}
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
              t('Host Approval Required', '需要主人批准')
            }</div>
          </>
        )}
      </div>
      
      {showBookingForm && !hasUserBooked && (
        <div className="mt-4 p-3 bg-cosmic-900/40 border border-cosmic-700/30 rounded-md">
          <h4 className="text-gray-200 font-medium mb-3">{t('Booking Details', '预订详情')}</h4>
          <div className="mb-3">
            <GuestSelector 
              onChange={handleGuestChange} 
              maxGuests={timeSlot.max_capacity}
            />
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

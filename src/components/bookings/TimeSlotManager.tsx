
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModal } from '@/contexts/ModalContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import TimeSlotForm from './TimeSlotForm';
import TimeSlotItem from './TimeSlotItem';
import { format, parseISO, isAfter } from 'date-fns';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/confirm-dialog';

interface TimeSlotManagerProps {
  spotId: string;
  creatorId: string;
  spotName: string;
}

// Define the profiles type to match what we expect
interface Profile {
  username: string | null;
  avatar_url: string | null;
}

// Define the reservation type
interface Reservation {
  id: string;
  user_id: string;
  status: string;
  profiles?: Profile;
}

// Define the TimeSlot type
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

const TimeSlotManager: React.FC<TimeSlotManagerProps> = ({ 
  spotId, 
  creatorId,
  spotName
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { modalType, modalData, openModal, closeModal } = useModal();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const isCreator = user?.id === creatorId;

  // Fetch time slots for this spot
  const { data: timeSlots, isLoading, refetch } = useQuery({
    queryKey: ['timeSlots', spotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('astro_spot_timeslots')
        .select(`
          id,
          spot_id,
          creator_id,
          start_time,
          end_time,
          max_capacity,
          description,
          price,
          currency,
          astro_spot_reservations (
            id,
            user_id,
            status
          )
        `)
        .eq('spot_id', spotId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      // Process the data to add profiles for each reservation
      const enhancedData = await Promise.all((data || []).map(async (slot) => {
        // For each reservation, fetch the user profile separately
        const enhancedReservations = await Promise.all(
          (slot.astro_spot_reservations || []).map(async (reservation) => {
            // Fetch profile for this user_id
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', reservation.user_id)
              .single();
              
            return {
              ...reservation,
              profiles: profileData || { username: null, avatar_url: null }
            };
          })
        );
        
        return {
          ...slot,
          astro_spot_reservations: enhancedReservations
        };
      }));
      
      return enhancedData as TimeSlot[];
    }
  });

  // Filter time slots for the selected date if any
  const filteredTimeSlots = timeSlots?.filter((slot) => {
    if (!selectedDate) return true;
    
    const slotDate = new Date(slot.start_time);
    return (
      slotDate.getDate() === selectedDate.getDate() &&
      slotDate.getMonth() === selectedDate.getMonth() &&
      slotDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Filter upcoming time slots (not in the past)
  const upcomingTimeSlots = filteredTimeSlots?.filter(slot => 
    isAfter(new Date(slot.start_time), new Date())
  );

  const handleAddSuccess = () => {
    setShowAddForm(false);
    refetch();
    toast.success(t("Time slots added successfully", "时间段添加成功"));
  };

  const handleBookingRequest = async (timeslotId: string, spotCreatorId: string) => {
    if (!user) {
      toast.error(t("You need to be logged in to book a time slot", "您需要登录才能预订时间段"));
      return;
    }

    try {
      // Create a reservation
      const { data, error } = await supabase.rpc('insert_astro_spot_reservation', {
        p_timeslot_id: timeslotId,
        p_user_id: user.id,
        p_status: 'confirmed'
      });

      if (error) throw error;
      
      // Create a message to notify the spot creator
      await supabase.from('user_messages').insert({
        sender_id: user.id,
        receiver_id: spotCreatorId,
        message: t(`I've booked a time slot for ${spotName}. Looking forward to it!`, 
                   `我已经预订了${spotName}的时间段。期待与您见面！`)
      });
      
      toast.success(t("Booking successful! A message has been sent to the creator.", 
                      "预订成功！已向创建者发送消息。"));
      refetch();
    } catch (error: any) {
      toast.error(error.message || t("Failed to book time slot", "预订时间段失败"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-cosmic-800/30 rounded-lg p-5 backdrop-blur-sm border border-cosmic-700/30">
      <h2 className="text-xl font-semibold text-gray-200 mb-3 flex items-center">
        <span className="w-2 h-6 bg-blue-500 rounded-sm mr-2.5"></span>
        {t("Availability & Bookings", "可用性和预订")}
      </h2>
      
      {isCreator && (
        <div className="mb-6">
          {showAddForm ? (
            <TimeSlotForm 
              spotId={spotId} 
              onSuccess={handleAddSuccess} 
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {t("Add Available Time Slot", "添加可用时间段")}
            </Button>
          )}
        </div>
      )}

      <div className="mb-6">
        <div className="block mb-2 text-gray-300">
          {t("Filter by Date", "按日期筛选")}
        </div>
        <div className="bg-cosmic-900/50 rounded-lg border border-cosmic-700/40 p-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="bg-cosmic-800/40 rounded-lg"
          />
        </div>
        {selectedDate && (
          <div className="mt-2 flex justify-end">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedDate(undefined)}
              size="sm"
            >
              {t("Clear Filter", "清除筛选")}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-300">
          {selectedDate 
            ? t(`Available on ${format(selectedDate, 'PPP')}`, `${format(selectedDate, 'PPP')} 可用时间`) 
            : t("All Available Time Slots", "所有可用时间段")}
        </h3>
        
        {upcomingTimeSlots && upcomingTimeSlots.length > 0 ? (
          <div className="space-y-3">
            {upcomingTimeSlots.map(slot => (
              <TimeSlotItem 
                key={slot.id}
                timeSlot={slot}
                isCreator={isCreator}
                onUpdate={refetch}
                onBook={() => handleBookingRequest(slot.id, creatorId)}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-cosmic-800/20 rounded-lg border border-cosmic-700/20">
            <p className="text-gray-400">
              {t("No available time slots found", "未找到可用时间段")}
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {modalType === 'confirmation' && modalData && (
        <ConfirmDialog
          isOpen={true}
          onClose={closeModal}
          onConfirm={() => modalData.onConfirm()}
          title={modalData.title}
          description={modalData.description}
          confirmText={modalData.confirmText}
          cancelText={modalData.cancelText}
        />
      )}
    </div>
  );
};

export default TimeSlotManager;

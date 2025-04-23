
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TimeSlotForm from './TimeSlotForm';
import TimeSlotItem from './TimeSlotItem';
import { format, parseISO, isAfter } from 'date-fns';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface TimeSlotManagerProps {
  spotId: string;
  isCreator: boolean;
}

const TimeSlotManager: React.FC<TimeSlotManagerProps> = ({ spotId, isCreator }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch time slots for this spot
  const { data: timeSlots, isLoading, refetch } = useQuery({
    queryKey: ['timeSlots', spotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('astro_spot_timeslots')
        .select('*, astro_spot_reservations(*, profiles:user_id(username, avatar_url))')
        .eq('spot_id', spotId)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data || [];
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
    toast.success(t("Time slot added successfully", "时间段添加成功"));
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
        <Label className="block mb-2 text-gray-300">
          {t("Filter by Date", "按日期筛选")}
        </Label>
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
    </div>
  );
};

export default TimeSlotManager;

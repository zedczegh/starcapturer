
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import TimeSlotForm from './TimeSlotForm';
import TimeSlotItem from './TimeSlotItem';
import { format, parseISO, isAfter, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import DateRangePicker from './DateRangePicker';

interface TimeSlotManagerProps {
  spotId: string;
  isCreator: boolean;
}

const TimeSlotManager: React.FC<TimeSlotManagerProps> = ({ spotId, isCreator }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch time slots for this spot
  const { data: timeSlots, isLoading, refetch } = useQuery({
    queryKey: ['timeSlots', spotId],
    queryFn: async () => {
      // Use fetch to directly access the Supabase API
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch(
        `https://fmnivvwpyriufxaebbzi.supabase.co/rest/v1/astro_spot_timeslots?spot_id=eq.${spotId}&order=start_time.asc`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbml2dndweXJpdWZ4YWViYnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3ODU3NTAsImV4cCI6MjA2MDM2MTc1MH0.HZX_hS0A1nUB3iO7wDmTjMBoYk3hQz6lqmyBEYvoQ9Y',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch time slots');
      }

      const data = await response.json();
      
      // Fetch reservations for each time slot
      for (const slot of data || []) {
        const reservationsResponse = await fetch(
          `https://fmnivvwpyriufxaebbzi.supabase.co/rest/v1/astro_spot_reservations?timeslot_id=eq.${slot.id}`,
          {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbml2dndweXJpdWZ4YWViYnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3ODU3NTAsImV4cCI6MjA2MDM2MTc1MH0.HZX_hS0A1nUB3iO7wDmTjMBoYk3hQz6lqmyBEYvoQ9Y',
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!reservationsResponse.ok) {
          throw new Error('Failed to fetch reservations');
        }
        
        const reservations = await reservationsResponse.json();
        slot.astro_spot_reservations = reservations;
        
        // Get user profiles for each reservation
        if (reservations.length > 0) {
          const userIds = reservations.map((res: any) => res.user_id);
          const userIdsQuery = userIds.map((id: string) => `id=eq.${id}`).join(',');
            
          const profilesResponse = await fetch(
            `https://fmnivvwpyriufxaebbzi.supabase.co/rest/v1/profiles?${userIdsQuery}`,
            {
              headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbml2dndweXJpdWZ4YWViYnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3ODU3NTAsImV4cCI6MjA2MDM2MTc1MH0.HZX_hS0A1nUB3iO7wDmTjMBoYk3hQz6lqmyBEYvoQ9Y',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
            
          if (profilesResponse.ok) {
            const profiles = await profilesResponse.json();
            
            // Attach profile to each reservation
            if (profiles) {
              slot.astro_spot_reservations = slot.astro_spot_reservations.map((res: any) => {
                const profile = profiles.find((p: any) => p.id === res.user_id);
                return { ...res, profiles: profile };
              });
            }
          }
        }
      }
      
      return data;
    }
  });

  // Filter time slots based on the selected date range
  const filteredTimeSlots = timeSlots?.filter((slot) => {
    const slotDate = new Date(slot.start_time);
    
    // If no date filter is active, show all
    if (!startDate && !endDate) {
      return true;
    }
    
    // If only start date is selected
    if (startDate && !endDate) {
      const startOfSelectedDate = startOfDay(startDate);
      const endOfSelectedDate = endOfDay(startDate);
      return isWithinInterval(slotDate, { 
        start: startOfSelectedDate, 
        end: endOfSelectedDate 
      });
    }
    
    // If both dates are selected, filter by range
    if (startDate && endDate) {
      const startOfRange = startOfDay(startDate);
      const endOfRange = endOfDay(endDate);
      return isWithinInterval(slotDate, { 
        start: startOfRange, 
        end: endOfRange
      });
    }
    
    return true;
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

      {/* Only show date range picker for guests (non-creators) */}
      {!isCreator && (
        <div className="mb-6">
          <DateRangePicker 
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-3">
          {upcomingTimeSlots && upcomingTimeSlots.length > 0 ? (
            upcomingTimeSlots.map(slot => (
              <TimeSlotItem 
                key={slot.id}
                timeSlot={slot}
                isCreator={isCreator}
                onUpdate={refetch}
              />
            ))
          ) : (
            <div className="py-8 text-center bg-cosmic-800/20 rounded-lg border border-cosmic-700/20">
              <p className="text-gray-400">
                {t("No available time slots found", "没有找到可用时间段")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeSlotManager;

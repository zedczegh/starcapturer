
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
import { groupTimeSlotsByConsecutiveDates, formatDateRanges } from '@/utils/dateRangeUtils';

interface TimeSlotManagerProps {
  spotId: string;
  isCreator: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
}

const TimeSlotManager: React.FC<TimeSlotManagerProps> = ({ spotId, isCreator, verificationStatus }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
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

  // Filter upcoming time slots (not in the past)
  const upcomingTimeSlots = timeSlots?.filter(slot => 
    isAfter(new Date(slot.start_time), new Date())
  );

  // Group time slots by consecutive dates
  const groupedTimeSlots = upcomingTimeSlots ? groupTimeSlotsByConsecutiveDates(upcomingTimeSlots) : [];

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
          {verificationStatus !== 'verified' && (
            <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                {t(
                  'Your AstroSpot must be verified before you can add time slots and start earning.',
                  '您的观星点必须先通过验证才能添加时间段并开始盈利。'
                )}
              </p>
            </div>
          )}
          
          {showAddForm ? (
            <TimeSlotForm 
              spotId={spotId} 
              onSuccess={handleAddSuccess} 
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <Button 
              onClick={() => setShowAddForm(true)}
              disabled={verificationStatus !== 'verified'}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("Add Available Time Slot", "添加可用时间段")}
            </Button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {groupedTimeSlots.length > 0 ? (
          groupedTimeSlots.map((group, groupIndex) => (
            <TimeSlotItem 
              key={group[0].id}
              timeSlot={group[0]}
              isCreator={isCreator}
              onUpdate={refetch}
              group={group}
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
  );
};

export default TimeSlotManager;

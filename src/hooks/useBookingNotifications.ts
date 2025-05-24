
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export const useBookingNotifications = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!user) return;

    // Subscribe to new reservations for spots owned by the current user
    const channel = supabase
      .channel('booking-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'astro_spot_reservations',
        },
        async (payload) => {
          console.log('New reservation detected:', payload);
          
          // Get the reservation details with spot information
          const { data: reservationData, error } = await supabase
            .from('astro_spot_reservations')
            .select(`
              *,
              astro_spot_timeslots (
                *,
                user_astro_spots (
                  id,
                  name,
                  user_id
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error || !reservationData) {
            console.error('Error fetching reservation details:', error);
            return;
          }

          // Check if this reservation is for a spot owned by the current user
          const spotOwnerId = reservationData.astro_spot_timeslots?.user_astro_spots?.user_id;
          const bookerUserId = reservationData.user_id;
          
          // Only show notification if current user owns the spot and didn't make the booking
          if (spotOwnerId === user.id && bookerUserId !== user.id) {
            const spotName = reservationData.astro_spot_timeslots?.user_astro_spots?.name || 'Unknown Spot';
            const timeAgo = formatDistanceToNow(new Date(reservationData.created_at), { addSuffix: true });
            
            toast.success(
              t(
                `A user has booked your astrospot: ${spotName}, ${timeAgo}, please check your messages!`,
                `用户已预订您的观星点：${spotName}，${timeAgo}，请查看您的消息！`
              ),
              {
                duration: 8000,
                action: {
                  label: t('View Messages', '查看消息'),
                  onClick: () => {
                    window.location.href = '/messages';
                  }
                }
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, t]);
};

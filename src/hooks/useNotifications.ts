
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface NotificationCounts {
  unreadMessages: number;
  newReservations: number;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadMessages: 0,
    newReservations: 0
  });

  useEffect(() => {
    if (!user) return;

    // Fetch initial counts
    const fetchCounts = async () => {
      // Get unread messages count
      const { data: messagesData } = await supabase
        .from('user_messages')
        .select('id')
        .eq('receiver_id', user.id)
        .eq('read', false);

      // Get new reservations count (for spots owned by current user)
      const { data: reservationsData } = await supabase
        .from('astro_spot_reservations')
        .select(`
          id,
          astro_spot_timeslots!inner (
            user_astro_spots!inner (
              user_id
            )
          )
        `)
        .eq('astro_spot_timeslots.user_astro_spots.user_id', user.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      setCounts({
        unreadMessages: messagesData?.length || 0,
        newReservations: reservationsData?.length || 0
      });
    };

    fetchCounts();

    // Subscribe to real-time updates for messages
    const messagesChannel = supabase
      .channel('messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          setCounts(prev => ({ ...prev, unreadMessages: prev.unreadMessages + 1 }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.read === true && payload.old.read === false) {
            setCounts(prev => ({ ...prev, unreadMessages: Math.max(0, prev.unreadMessages - 1) }));
          }
        }
      )
      .subscribe();

    // Subscribe to real-time updates for reservations
    const reservationsChannel = supabase
      .channel('reservations-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'astro_spot_reservations'
        },
        async (payload) => {
          // Check if this reservation is for a spot owned by the current user
          const { data: reservationData } = await supabase
            .from('astro_spot_reservations')
            .select(`
              *,
              astro_spot_timeslots (
                user_astro_spots (
                  user_id
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (reservationData?.astro_spot_timeslots?.user_astro_spots?.user_id === user.id) {
            setCounts(prev => ({ ...prev, newReservations: prev.newReservations + 1 }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(reservationsChannel);
    };
  }, [user]);

  const markMessagesAsRead = () => {
    setCounts(prev => ({ ...prev, unreadMessages: 0 }));
  };

  const markReservationsAsViewed = () => {
    setCounts(prev => ({ ...prev, newReservations: 0 }));
  };

  return {
    counts,
    markMessagesAsRead,
    markReservationsAsViewed
  };
};


import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useNotifications = () => {
  const { user } = useAuth();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [newReservationsCount, setNewReservationsCount] = useState(0);
  const [lastVisitedMessages, setLastVisitedMessages] = useState<string | null>(null);
  const [lastVisitedAstroSpots, setLastVisitedAstroSpots] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Get last visited timestamps from localStorage
    const lastMessagesVisit = localStorage.getItem('lastVisitedMessages');
    const lastAstroSpotsVisit = localStorage.getItem('lastVisitedAstroSpots');
    
    setLastVisitedMessages(lastMessagesVisit);
    setLastVisitedAstroSpots(lastAstroSpotsVisit);

    // Fetch initial counts
    fetchUnreadMessagesCount();
    fetchNewReservationsCount();

    // Subscribe to real-time updates for messages
    const messagesChannel = supabase
      .channel('messages-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadMessagesCount();
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
          table: 'astro_spot_reservations',
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
            .maybeSingle();

          if (reservationData?.astro_spot_timeslots?.user_astro_spots?.user_id === user.id) {
            fetchNewReservationsCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(reservationsChannel);
    };
  }, [user]);

  const fetchUnreadMessagesCount = async () => {
    if (!user || !lastVisitedMessages) return;

    try {
      const { count } = await supabase
        .from('user_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .gt('created_at', lastVisitedMessages);

      setUnreadMessagesCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
    }
  };

  const fetchNewReservationsCount = async () => {
    if (!user || !lastVisitedAstroSpots) return;

    try {
      // Get reservations for spots owned by the current user that are newer than last visit
      const { count } = await supabase
        .from('astro_spot_reservations')
        .select(`
          *,
          astro_spot_timeslots!inner (
            user_astro_spots!inner (
              user_id
            )
          )
        `, { count: 'exact', head: true })
        .eq('astro_spot_timeslots.user_astro_spots.user_id', user.id)
        .gt('created_at', lastVisitedAstroSpots);

      setNewReservationsCount(count || 0);
    } catch (error) {
      console.error('Error fetching new reservations count:', error);
    }
  };

  const markMessagesAsViewed = () => {
    const now = new Date().toISOString();
    localStorage.setItem('lastVisitedMessages', now);
    setLastVisitedMessages(now);
    setUnreadMessagesCount(0);
  };

  const markAstroSpotsAsViewed = () => {
    const now = new Date().toISOString();
    localStorage.setItem('lastVisitedAstroSpots', now);
    setLastVisitedAstroSpots(now);
    setNewReservationsCount(0);
  };

  return {
    unreadMessagesCount,
    newReservationsCount,
    markMessagesAsViewed,
    markAstroSpotsAsViewed,
  };
};

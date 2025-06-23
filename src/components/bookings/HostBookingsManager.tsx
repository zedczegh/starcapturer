
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format, parseISO, isSameDay, addDays } from 'date-fns';
import { toast } from 'sonner';
import { Calendar, User, Trash2, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CheckInOutManager from './CheckInOutManager';

// Define the reservation type with guest profile and new check-in/out fields
type ReservationWithGuest = {
  id: string;
  user_id: string;
  timeslot_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  checked_in_at?: string | null;
  checked_out_at?: string | null;
  host_notes?: string | null;
  astro_spot_timeslots: {
    id: string;
    spot_id: string;
    creator_id: string;
    start_time: string;
    end_time: string;
    max_capacity: number;
    description: string;
    price: number;
    currency: string;
    pets_policy: string;
    created_at: string;
    updated_at: string;
  } | null;
  guest_profile?: {
    id: string;
    username: string;
  };
};

type GroupedReservation = {
  guestProfile: ReservationWithGuest['guest_profile'];
  reservations: ReservationWithGuest[];
  startDate: Date;
  endDate: Date;
  totalNights: number;
  hasConfirmedReservations: boolean;
};

interface HostBookingsManagerProps {
  spotId: string;
  spotName: string;
}

const HostBookingsManager: React.FC<HostBookingsManagerProps> = ({ spotId, spotName }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['spotReservations', spotId],
    queryFn: async (): Promise<ReservationWithGuest[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('astro_spot_reservations')
        .select(`
          *,
          astro_spot_timeslots (*)
        `)
        .eq('astro_spot_timeslots.spot_id', spotId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out reservations with null timeslots to prevent errors
      const validReservations = (data || []).filter(reservation => 
        reservation.astro_spot_timeslots !== null
      );

      // Fetch profiles for each reservation
      if (validReservations.length > 0) {
        const userIds = validReservations
          .map(reservation => reservation.user_id)
          .filter(Boolean);
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds);

          // Add profile data to reservations
          return validReservations.map(reservation => ({
            ...reservation,
            guest_profile: profiles?.find(profile => 
              profile.id === reservation.user_id
            )
          })) as ReservationWithGuest[];
        }
      }

      return validReservations as ReservationWithGuest[];
    },
    enabled: !!user && !!spotId
  });

  // Group reservations by guest and consecutive dates
  const groupedReservations = React.useMemo(() => {
    if (!reservations) return [];

    const groups: GroupedReservation[] = [];
    const guestGroups = new Map<string, ReservationWithGuest[]>();

    // Group by guest first, filtering out reservations with null timeslots
    reservations.forEach(reservation => {
      if (!reservation.astro_spot_timeslots?.start_time) return;
      
      const guestId = reservation.user_id;
      if (guestId) {
        if (!guestGroups.has(guestId)) {
          guestGroups.set(guestId, []);
        }
        guestGroups.get(guestId)!.push(reservation);
      }
    });

    // For each guest, group consecutive dates
    guestGroups.forEach(guestReservations => {
      if (guestReservations.length === 0) return;

      // Sort by date, ensuring timeslots exist
      const sorted = guestReservations
        .filter(reservation => reservation.astro_spot_timeslots?.start_time)
        .sort((a, b) => 
          new Date(a.astro_spot_timeslots!.start_time).getTime() - 
          new Date(b.astro_spot_timeslots!.start_time).getTime()
        );

      if (sorted.length === 0) return;

      let currentGroup: ReservationWithGuest[] = [sorted[0]];
      
      for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const previous = sorted[i - 1];
        
        if (!current.astro_spot_timeslots?.start_time || !previous.astro_spot_timeslots?.start_time) {
          continue;
        }
        
        const currentDate = new Date(current.astro_spot_timeslots.start_time);
        const previousDate = new Date(previous.astro_spot_timeslots.start_time);
        
        // Check if dates are consecutive
        const isConsecutive = isSameDay(currentDate, addDays(previousDate, 1));
        
        if (isConsecutive) {
          currentGroup.push(current);
        } else {
          // Create group from current group
          if (currentGroup.length > 0 && currentGroup[0].astro_spot_timeslots) {
            const startDate = new Date(currentGroup[0].astro_spot_timeslots.start_time);
            const endDate = new Date(currentGroup[currentGroup.length - 1].astro_spot_timeslots!.end_time);
            const totalNights = currentGroup.length;
            const hasConfirmedReservations = currentGroup.some(r => r.status === 'confirmed');

            groups.push({
              guestProfile: currentGroup[0].guest_profile,
              reservations: currentGroup,
              startDate,
              endDate,
              totalNights,
              hasConfirmedReservations
            });
          }
          
          // Start new group
          currentGroup = [current];
        }
      }
      
      // Add the last group
      if (currentGroup.length > 0 && currentGroup[0].astro_spot_timeslots) {
        const startDate = new Date(currentGroup[0].astro_spot_timeslots.start_time);
        const endDate = new Date(currentGroup[currentGroup.length - 1].astro_spot_timeslots!.end_time);
        const totalNights = currentGroup.length;
        const hasConfirmedReservations = currentGroup.some(r => r.status === 'confirmed');

        groups.push({
          guestProfile: currentGroup[0].guest_profile,
          reservations: currentGroup,
          startDate,
          endDate,
          totalNights,
          hasConfirmedReservations
        });
      }
    });

    return groups;
  }, [reservations]);

  // Send auto-message to guest when cancelling
  const sendCancellationMessage = async (guestUserId: string, guestUsername: string) => {
    try {
      const message = `I'm sorry, I cannot provide services according to your requested timeline! Please feel free to DM me for any questions!`;
      
      const { error } = await supabase.from('user_messages').insert({
        sender_id: user!.id,
        receiver_id: guestUserId,
        message: message,
      });

      if (error) {
        console.error('Error sending cancellation message to guest:', error);
      } else {
        console.log('Cancellation message sent to guest successfully');
      }
    } catch (error) {
      console.error('Error in sendCancellationMessage:', error);
    }
  };

  const cancelReservationMutation = useMutation({
    mutationFn: async ({ reservationIds, guestUserId, guestUsername }: { 
      reservationIds: string[]; 
      guestUserId: string; 
      guestUsername: string; 
    }) => {
      // Cancel all reservations in the group
      for (const id of reservationIds) {
        const { error } = await supabase
          .from('astro_spot_reservations')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }

      // Send auto-message to guest
      await sendCancellationMessage(guestUserId, guestUsername);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spotReservations', spotId] });
      toast.success(t('Reservation cancelled and guest notified', '预订已取消并已通知客人'));
    },
    onError: (error) => {
      console.error('Error cancelling reservation:', error);
      toast.error(t('Failed to cancel reservation', '取消预订失败'));
    }
  });

  const handleContactGuest = (guestUserId: string, guestUsername: string) => {
    console.log('Navigating to messages with guest:', guestUserId, guestUsername);
    navigate('/messages', { 
      state: { 
        selectedUserId: guestUserId,
        selectedUsername: guestUsername,
        timestamp: Date.now()
      }
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="text-gray-400">{t('Loading bookings...', '加载预订中...')}</div>
      </div>
    );
  }

  if (!groupedReservations || groupedReservations.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">
          {t('No bookings found', '没有找到预订')}
        </h3>
        <p className="text-gray-500">
          {t('No one has booked this astro spot yet', '还没有人预订这个观星点')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">
        {t('Guest Bookings', '客人预订')} ({groupedReservations.length})
      </h3>
      
      {groupedReservations.map((group, index) => (
        <Card key={`${group.guestProfile?.id}-${index}`} className="bg-cosmic-800/60 border-cosmic-700/40 p-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-100 mb-2">
                    {t('Guest', '客人')}: {group.guestProfile?.username || t('Unknown Guest', '未知客人')}
                  </h4>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {group.totalNights === 1 
                          ? format(group.startDate, 'MMM d, yyyy')
                          : `${format(group.startDate, 'MMM d')}-${format(group.endDate, 'MMM d, yyyy')} (${group.totalNights} ${group.totalNights === 1 ? 'night' : 'nights'})`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{t('Booked at', '预订于')}: {format(parseISO(group.reservations[0].created_at), 'MMM d, yyyy HH:mm')}</span>
                    </div>
                  </div>

                  {/* Check-in/Check-out Status for each reservation in the group */}
                  <div className="space-y-2 mb-4">
                    {group.reservations.map((reservation) => (
                      <div key={reservation.id} className="border border-cosmic-600/30 rounded-lg p-3 bg-cosmic-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">
                            {format(new Date(reservation.astro_spot_timeslots!.start_time), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <CheckInOutManager
                          reservation={reservation}
                          guestUsername={group.guestProfile?.username || 'Guest'}
                          spotId={spotId}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleContactGuest(group.guestProfile?.id || '', group.guestProfile?.username || 'Guest')}
                className="bg-cosmic-700/50 border-cosmic-600/50 hover:bg-cosmic-600/50"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('Contact Guest', '联系客人')}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-red-600/20 border-red-600/30 text-red-400 hover:bg-red-600/30"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('Cancel Booking', '取消预订')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-cosmic-800 border-cosmic-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-gray-100">
                      {t('Cancel Guest Booking', '取消客人预订')}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      {group.totalNights > 1 
                        ? t('Are you sure you want to cancel this guest\'s booking? This will cancel all nights and send them an automatic message explaining the cancellation.', 
                           '您确定要取消此客人的预订吗？这将取消所有夜晚并向他们发送解释取消的自动消息。')
                        : t('Are you sure you want to cancel this guest\'s booking? This will send them an automatic message explaining the cancellation.', 
                           '您确定要取消此客人的预订吗？这将向他们发送解释取消的自动消息。')
                      }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-cosmic-700 border-cosmic-600 text-gray-300 hover:bg-cosmic-600">
                      {t('Keep Booking', '保留预订')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => cancelReservationMutation.mutate({
                        reservationIds: group.reservations.map(r => r.id),
                        guestUserId: group.guestProfile?.id || '',
                        guestUsername: group.guestProfile?.username || 'Guest'
                      })}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={cancelReservationMutation.isPending}
                    >
                      {cancelReservationMutation.isPending 
                        ? t('Cancelling...', '取消中...') 
                        : t('Cancel Booking', '取消预订')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default HostBookingsManager;

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format, parseISO, isSameDay, addDays } from 'date-fns';
import { toast } from 'sonner';
import { Calendar, MapPin, User, Trash2, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import CheckInOutManager from '@/components/bookings/CheckInOutManager';
import NavBar from '@/components/NavBar';

// Define the extended reservation type with check-in/out fields
type ReservationWithProfile = {
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
    user_astro_spots: {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      user_id: string;
    };
  } | null;
  host_profile?: {
    id: string;
    username: string;
  };
};

type GroupedReservation = {
  spot: ReservationWithProfile['astro_spot_timeslots']['user_astro_spots'];
  hostProfile: ReservationWithProfile['host_profile'];
  reservations: ReservationWithProfile[];
  startDate: Date;
  endDate: Date;
  totalNights: number;
  hasConfirmedReservations: boolean;
};

const MyReservations = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['userReservations', user?.id],
    queryFn: async (): Promise<ReservationWithProfile[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('astro_spot_reservations')
        .select(`
          *,
          astro_spot_timeslots (
            *,
            user_astro_spots (
              id,
              name,
              latitude,
              longitude,
              user_id
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out reservations with null timeslots to prevent errors
      const validReservations = (data || []).filter(reservation => 
        reservation.astro_spot_timeslots !== null
      );

      // Fetch profiles for each reservation separately
      if (validReservations.length > 0) {
        const userIds = validReservations
          .map(reservation => reservation.astro_spot_timeslots?.user_astro_spots?.user_id)
          .filter(Boolean);
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds);

          // Add profile data to reservations
          return validReservations.map(reservation => ({
            ...reservation,
            host_profile: profiles?.find(profile => 
              profile.id === reservation.astro_spot_timeslots?.user_astro_spots?.user_id
            )
          })) as ReservationWithProfile[];
        }
      }

      return validReservations as ReservationWithProfile[];
    },
    enabled: !!user
  });

  // Group reservations by spot and consecutive dates
  const groupedReservations = React.useMemo(() => {
    if (!reservations) return [];

    const groups: GroupedReservation[] = [];
    const spotGroups = new Map<string, ReservationWithProfile[]>();

    // Group by spot first, filtering out reservations with null timeslots
    reservations.forEach(reservation => {
      if (!reservation.astro_spot_timeslots?.user_astro_spots?.id) return;
      
      const spotId = reservation.astro_spot_timeslots.user_astro_spots.id;
      if (!spotGroups.has(spotId)) {
        spotGroups.set(spotId, []);
      }
      spotGroups.get(spotId)!.push(reservation);
    });

    // For each spot, group consecutive dates
    spotGroups.forEach(spotReservations => {
      if (spotReservations.length === 0) return;

      // Sort by date, ensuring timeslots exist
      const sorted = spotReservations
        .filter(reservation => reservation.astro_spot_timeslots?.start_time)
        .sort((a, b) => 
          new Date(a.astro_spot_timeslots!.start_time).getTime() - 
          new Date(b.astro_spot_timeslots!.start_time).getTime()
        );

      if (sorted.length === 0) return;

      let currentGroup: ReservationWithProfile[] = [sorted[0]];
      
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
              spot: currentGroup[0].astro_spot_timeslots.user_astro_spots,
              hostProfile: currentGroup[0].host_profile,
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
          spot: currentGroup[0].astro_spot_timeslots.user_astro_spots,
          hostProfile: currentGroup[0].host_profile,
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

  const cancelReservationMutation = useMutation({
    mutationFn: async (reservationIds: string[]) => {
      // Cancel all reservations in the group
      for (const id of reservationIds) {
        const { error } = await supabase
          .from('astro_spot_reservations')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userReservations', user?.id] });
      toast.success(t('Reservation cancelled successfully', '预订已成功取消'));
    },
    onError: (error) => {
      console.error('Error cancelling reservation:', error);
      toast.error(t('Failed to cancel reservation', '取消预订失败'));
    }
  });

  const handleContactHost = (hostUserId: string, hostUsername: string) => {
    console.log('Navigating to messages with user:', hostUserId, hostUsername);
    navigate('/messages', { 
      state: { 
        selectedUserId: hostUserId,
        selectedUsername: hostUsername,
        timestamp: Date.now()
      }
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-cosmic-900 flex items-center justify-center">
        <NavBar />
        <div className="text-center pt-24">
          <p className="text-gray-300 mb-4">{t('Please sign in to view your reservations', '请登录查看您的预订')}</p>
          <Button onClick={() => navigate('/photo-points')} className="bg-blue-600 hover:bg-blue-700">
            {t('Go to Login', '去登录')}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cosmic-900 flex items-center justify-center">
        <NavBar />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-900 text-gray-100">
      <NavBar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-100">
              {t('My Reservations', '我的预订')}
            </h1>
          </div>
          <p className="text-gray-400">
            {t('Manage your astro spot reservations', '管理您的观星点预订')}
          </p>
        </div>

        {!groupedReservations || groupedReservations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">
              {t('No reservations found', '没有找到预订')}
            </h3>
            <p className="text-gray-500 mb-6">
              {t('You haven\'t made any reservations yet', '您还没有任何预订')}
            </p>
            <Button 
              onClick={() => navigate('/community')} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              {t('Browse Astro Spots', '浏览观星点')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {groupedReservations.map((group, index) => (
              <Card key={`${group.spot?.id}-${index}`} className="bg-cosmic-800/60 border-cosmic-700/40 p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-100 mb-2">
                          {group.spot?.name || t('Unknown Spot', '未知地点')}
                        </h3>
                        
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
                            <MapPin className="h-4 w-4" />
                            <span>
                              {group.spot?.latitude?.toFixed(4)}, {group.spot?.longitude?.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{group.hostProfile?.username || t('Unknown Host', '未知主人')}</span>
                          </div>
                        </div>

                        {/* Show individual reservation statuses */}
                        <div className="space-y-2 mb-4">
                          {group.reservations.map((reservation) => (
                            <div key={reservation.id} className="border border-cosmic-600/30 rounded-lg p-3 bg-cosmic-700/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">
                                  {format(new Date(reservation.astro_spot_timeslots!.start_time), 'MMM d, yyyy')}
                                </span>
                              </div>
                              <CheckInOutManager
                                reservation={{
                                  ...reservation,
                                  astro_spot_timeslots: reservation.astro_spot_timeslots
                                }}
                                guestUsername={user?.email || 'Guest'}
                                spotId={group.spot?.id || ''}
                                isHost={false}
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
                      onClick={() => handleContactHost(group.spot?.user_id, group.hostProfile?.username || 'Host')}
                      className="bg-cosmic-700/50 border-cosmic-600/50 hover:bg-cosmic-600/50"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {t('Contact Host', '联系主人')}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-600/20 border-red-600/30 text-red-400 hover:bg-red-600/30"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('Cancel', '取消')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-cosmic-800 border-cosmic-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-gray-100">
                            {t('Cancel Reservation', '取消预订')}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            {group.totalNights > 1 
                              ? t('Are you sure you want to cancel these reservations? This will cancel all nights in this booking and cannot be undone.', 
                                 '您确定要取消这些预订吗？这将取消此预订中的所有夜晚，且无法撤销。')
                              : t('Are you sure you want to cancel this reservation? This action cannot be undone.', 
                                 '您确定要取消此预订吗？此操作无法撤销。')
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-cosmic-700 border-cosmic-600 text-gray-300 hover:bg-cosmic-600">
                            {t('Keep Reservation', '保留预订')}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cancelReservationMutation.mutate(group.reservations.map(r => r.id))}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={cancelReservationMutation.isPending}
                          >
                            {cancelReservationMutation.isPending 
                              ? t('Cancelling...', '取消中...') 
                              : t('Cancel Reservation', '取消预订')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReservations;

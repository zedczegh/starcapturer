
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Calendar, MapPin, User, Trash2, MessageCircle, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Define the extended reservation type
type ReservationWithProfile = {
  id: string;
  user_id: string;
  timeslot_id: string;
  status: string;
  created_at: string;
  updated_at: string;
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
  };
  host_profile?: {
    id: string;
    username: string;
  };
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

      // Fetch profiles for each reservation separately
      if (data && data.length > 0) {
        const userIds = data
          .map(reservation => reservation.astro_spot_timeslots?.user_astro_spots?.user_id)
          .filter(Boolean);
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds);

          // Add profile data to reservations
          return data.map(reservation => ({
            ...reservation,
            host_profile: profiles?.find(profile => 
              profile.id === reservation.astro_spot_timeslots?.user_astro_spots?.user_id
            )
          })) as ReservationWithProfile[];
        }
      }

      return (data || []) as ReservationWithProfile[];
    },
    enabled: !!user
  });

  const cancelReservationMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from('astro_spot_reservations')
        .delete()
        .eq('id', reservationId);
      
      if (error) throw error;
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

  const handleContactHost = (hostUserId: string) => {
    navigate(`/messages?user=${hostUserId}`);
  };

  const handleEditDates = (spotId: string) => {
    navigate(`/astro-spot/${spotId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-cosmic-900 flex items-center justify-center">
        <div className="text-center">
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">
            {t('My Reservations', '我的预订')}
          </h1>
          <p className="text-gray-400">
            {t('Manage your astro spot reservations', '管理您的观星点预订')}
          </p>
        </div>

        {!reservations || reservations.length === 0 ? (
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
            {reservations.map((reservation) => {
              const timeslot = reservation.astro_spot_timeslots;
              const spot = timeslot?.user_astro_spots;
              const hostProfile = reservation.host_profile;

              return (
                <Card key={reservation.id} className="bg-cosmic-800/60 border-cosmic-700/40 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-100 mb-2">
                            {spot?.name || t('Unknown Spot', '未知地点')}
                          </h3>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {timeslot?.start_time && format(parseISO(timeslot.start_time), 'MMM d, yyyy HH:mm')} - 
                                {timeslot?.end_time && format(parseISO(timeslot.end_time), 'HH:mm')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {spot?.latitude?.toFixed(4)}, {spot?.longitude?.toFixed(4)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{hostProfile?.username || t('Unknown Host', '未知主人')}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Badge 
                              variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}
                              className={
                                reservation.status === 'confirmed' 
                                  ? 'bg-green-600/20 text-green-400 border-green-600/30' 
                                  : 'bg-gray-600/20 text-gray-400 border-gray-600/30'
                              }
                            >
                              {reservation.status === 'confirmed' 
                                ? t('Confirmed', '已确认') 
                                : t('Pending', '待定')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactHost(spot?.user_id)}
                        className="bg-cosmic-700/50 border-cosmic-600/50 hover:bg-cosmic-600/50"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {t('Contact Host', '联系主人')}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDates(spot?.id)}
                        className="bg-cosmic-700/50 border-cosmic-600/50 hover:bg-cosmic-600/50"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {t('Edit Dates', '编辑日期')}
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
                              {t('Are you sure you want to cancel this reservation? This action cannot be undone.', 
                                 '您确定要取消此预订吗？此操作无法撤销。')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-cosmic-700 border-cosmic-600 text-gray-300 hover:bg-cosmic-600">
                              {t('Keep Reservation', '保留预订')}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelReservationMutation.mutate(reservation.id)}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReservations;

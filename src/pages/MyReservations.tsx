
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import NavBar from '@/components/NavBar';
import AboutFooter from '@/components/about/AboutFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar, MapPin, Users, Clock, MessageCircle, X, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ReservationEditDialog from '@/components/reservations/ReservationEditDialog';
import { useNavigate } from 'react-router-dom';

const MyReservations = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [editingReservation, setEditingReservation] = useState<any>(null);

  // Fetch user's reservations
  const { data: reservations, isLoading, refetch } = useQuery({
    queryKey: ['myReservations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch(
        `https://fmnivvwpyriufxaebbzi.supabase.co/rest/v1/astro_spot_reservations?user_id=eq.${user.id}&select=*,astro_spot_timeslots(*,user_astro_spots(*))&order=created_at.desc`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbml2dndweXJpdWZ4YWViYnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3ODU3NTAsImV4cCI6MjA2MDM2MTc1MH0.HZX_hS0A1nUB3iO7wDmTjMBoYk3hQz6lqmyBEYvoQ9Y',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }

      return response.json();
    },
    enabled: !!user?.id
  });

  const handleCancelReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('astro_spot_reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success(t('Reservation cancelled successfully', '预订取消成功'));
      refetch();
    } catch (error: any) {
      console.error('Error cancelling reservation:', error);
      toast.error(t('Failed to cancel reservation', '取消预订失败'));
    }
  };

  const handleContactHost = (hostId: string) => {
    navigate(`/messages?userId=${hostId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
        <NavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              {t('Please sign in to view your reservations', '请登录查看您的预订')}
            </h2>
            <Button onClick={() => navigate('/')}>
              {t('Go to Home', '返回首页')}
            </Button>
          </div>
        </div>
        <AboutFooter />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
        <NavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <AboutFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 flex flex-col">
      <NavBar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            {t('My Reservations', '我的预订')}
          </h1>

          {reservations && reservations.length > 0 ? (
            <div className="space-y-6">
              {reservations.map((reservation: any) => (
                <Card key={reservation.id} className="bg-cosmic-800/60 border-cosmic-700/40">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        {reservation.astro_spot_timeslots?.user_astro_spots?.name || t('AstroSpot', '观星点')}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        reservation.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        reservation.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {reservation.status === 'confirmed' ? t('Confirmed', '已确认') :
                         reservation.status === 'cancelled' ? t('Cancelled', '已取消') :
                         t('Pending', '待处理')}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(reservation.astro_spot_timeslots?.start_time), 'MMM d, yyyy HH:mm')} - 
                          {format(new Date(reservation.astro_spot_timeslots?.end_time), 'HH:mm')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="h-4 w-4" />
                        <span>
                          {t('Max Capacity', '最大容量')}: {reservation.astro_spot_timeslots?.max_capacity}
                        </span>
                      </div>
                    </div>

                    {reservation.astro_spot_timeslots?.description && (
                      <div className="text-gray-300">
                        <p className="font-medium mb-1">{t('Description', '描述')}:</p>
                        <p className="text-sm">{reservation.astro_spot_timeslots.description}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-4">
                      {reservation.status === 'confirmed' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingReservation(reservation)}
                            className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {t('Edit Dates', '编辑日期')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleContactHost(reservation.astro_spot_timeslots?.creator_id)}
                            className="bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30"
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {t('Contact Host', '联系主人')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelReservation(reservation.id)}
                            className="bg-red-600/20 border-red-500/30 text-red-400 hover:bg-red-600/30"
                          >
                            <X className="h-4 w-4 mr-1" />
                            {t('Cancel', '取消')}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-cosmic-800/60 border-cosmic-700/40">
              <CardContent className="py-16 text-center">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-200 mb-2">
                  {t('No reservations found', '没有找到预订')}
                </h3>
                <p className="text-gray-400 mb-6">
                  {t("You haven't made any reservations yet. Start exploring AstroSpots!", '您还没有任何预订。开始探索观星点吧！')}
                </p>
                <Button onClick={() => navigate('/astro-spots')}>
                  {t('Browse AstroSpots', '浏览观星点')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {editingReservation && (
        <ReservationEditDialog
          reservation={editingReservation}
          onClose={() => setEditingReservation(null)}
          onUpdate={refetch}
        />
      )}

      <AboutFooter />
    </div>
  );
};

export default MyReservations;

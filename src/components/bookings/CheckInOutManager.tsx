
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { LogIn, LogOut } from 'lucide-react';
import { isAfter, parseISO } from 'date-fns';
import ReservationStatusBadge from './ReservationStatusBadge';
import ReservationTimestamps from './ReservationTimestamps';

interface CheckInOutManagerProps {
  reservation: {
    id: string;
    status: string;
    checked_in_at?: string | null;
    checked_out_at?: string | null;
    host_notes?: string | null;
    astro_spot_timeslots?: {
      end_time: string;
    } | null;
  };
  guestUsername: string;
  spotId: string;
  isHost?: boolean;
}

const CheckInOutManager: React.FC<CheckInOutManagerProps> = ({ 
  reservation, 
  guestUsername, 
  spotId,
  isHost = true
}) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [hostNotes, setHostNotes] = React.useState(reservation.host_notes || '');

  // Check if reservation is past due
  const isPastDue = reservation.astro_spot_timeslots?.end_time 
    ? isAfter(new Date(), parseISO(reservation.astro_spot_timeslots.end_time))
    : false;

  const checkInMutation = useMutation({
    mutationFn: async ({ reservationId, notes }: { reservationId: string; notes: string }) => {
      const { error } = await supabase
        .from('astro_spot_reservations')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
          host_notes: notes || null
        })
        .eq('id', reservationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spotReservations', spotId] });
      queryClient.invalidateQueries({ queryKey: ['userReservations'] });
      toast.success(t('Guest checked in successfully', '客人签到成功'));
      setHostNotes('');
    },
    onError: (error) => {
      console.error('Error checking in guest:', error);
      toast.error(t('Failed to check in guest', '客人签到失败'));
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: async ({ reservationId, notes }: { reservationId: string; notes: string }) => {
      const { error } = await supabase
        .from('astro_spot_reservations')
        .update({
          status: 'checked_out',
          checked_out_at: new Date().toISOString(),
          host_notes: notes || null
        })
        .eq('id', reservationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spotReservations', spotId] });
      queryClient.invalidateQueries({ queryKey: ['userReservations'] });
      toast.success(t('Guest checked out successfully', '客人退房成功'));
      setHostNotes('');
    },
    onError: (error) => {
      console.error('Error checking out guest:', error);
      toast.error(t('Failed to check out guest', '客人退房失败'));
    }
  });

  const getActionButtons = () => {
    // If not host or reservation is past due, don't show action buttons
    if (!isHost || isPastDue) return null;

    if (reservation.status === 'confirmed') {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              className="bg-green-600/20 border-green-600/30 text-green-400 hover:bg-green-600/30"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {t('Check In', '签到')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-cosmic-800 border-cosmic-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-100">
                {t('Check In Guest', '客人签到')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {t('Confirm that {{guest}} has arrived and checked in.', '确认 {{guest}} 已到达并签到。')
                  .replace('{{guest}}', guestUsername)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="checkInNotes" className="text-gray-300">
                {t('Host Notes (Optional)', '主人备注 (可选)')}
              </Label>
              <Textarea
                id="checkInNotes"
                value={hostNotes}
                onChange={(e) => setHostNotes(e.target.value)}
                placeholder={t('Add any notes about the check-in...', '添加签到相关备注...')}
                className="mt-2 bg-cosmic-700/50 border-cosmic-600/50 text-gray-100"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-cosmic-700 border-cosmic-600 text-gray-300 hover:bg-cosmic-600">
                {t('Cancel', '取消')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => checkInMutation.mutate({
                  reservationId: reservation.id,
                  notes: hostNotes
                })}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={checkInMutation.isPending}
              >
                {checkInMutation.isPending 
                  ? t('Checking In...', '签到中...') 
                  : t('Check In', '签到')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }
    
    if (reservation.status === 'checked_in') {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              className="bg-orange-600/20 border-orange-600/30 text-orange-400 hover:bg-orange-600/30"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('Check Out', '退房')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-cosmic-800 border-cosmic-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-100">
                {t('Check Out Guest', '客人退房')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {t('Confirm that {{guest}} has checked out and left.', '确认 {{guest}} 已退房并离开。')
                  .replace('{{guest}}', guestUsername)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="checkOutNotes" className="text-gray-300">
                {t('Host Notes (Optional)', '主人备注 (可选)')}
              </Label>
              <Textarea
                id="checkOutNotes"
                value={hostNotes}
                onChange={(e) => setHostNotes(e.target.value)}
                placeholder={t('Add any notes about the check-out...', '添加退房相关备注...')}
                className="mt-2 bg-cosmic-700/50 border-cosmic-600/50 text-gray-100"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-cosmic-700 border-cosmic-600 text-gray-300 hover:bg-cosmic-600">
                {t('Cancel', '取消')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => checkOutMutation.mutate({
                  reservationId: reservation.id,
                  notes: hostNotes
                })}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                disabled={checkOutMutation.isPending}
              >
                {checkOutMutation.isPending 
                  ? t('Checking Out...', '退房中...') 
                  : t('Check Out', '退房')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <ReservationStatusBadge
          status={reservation.status}
          endTime={reservation.astro_spot_timeslots?.end_time || new Date().toISOString()}
          checkedInAt={reservation.checked_in_at}
          checkedOutAt={reservation.checked_out_at}
        />
        {getActionButtons()}
      </div>
      
      <ReservationTimestamps
        checkedInAt={reservation.checked_in_at}
        checkedOutAt={reservation.checked_out_at}
        hostNotes={reservation.host_notes}
        endTime={reservation.astro_spot_timeslots?.end_time || new Date().toISOString()}
        status={reservation.status}
      />
    </div>
  );
};

export default CheckInOutManager;

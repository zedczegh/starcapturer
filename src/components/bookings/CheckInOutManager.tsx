
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { CheckCircle, Clock, LogIn, LogOut } from 'lucide-react';
import { format } from 'date-fns';

interface CheckInOutManagerProps {
  reservation: {
    id: string;
    status: string;
    checked_in_at?: string | null;
    checked_out_at?: string | null;
    host_notes?: string | null;
  };
  guestUsername: string;
  spotId: string;
}

const CheckInOutManager: React.FC<CheckInOutManagerProps> = ({ 
  reservation, 
  guestUsername, 
  spotId 
}) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [hostNotes, setHostNotes] = React.useState(reservation.host_notes || '');

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
      toast.success(t('Guest checked out successfully', '客人退房成功'));
      setHostNotes('');
    },
    onError: (error) => {
      console.error('Error checking out guest:', error);
      toast.error(t('Failed to check out guest', '客人退房失败'));
    }
  });

  const getStatusBadge = () => {
    switch (reservation.status) {
      case 'confirmed':
        return (
          <Badge variant="default" className="bg-blue-600/20 text-blue-400 border-blue-600/30">
            <Clock className="h-3 w-3 mr-1" />
            {t('Confirmed', '已确认')}
          </Badge>
        );
      case 'checked_in':
        return (
          <Badge variant="default" className="bg-green-600/20 text-green-400 border-green-600/30">
            <LogIn className="h-3 w-3 mr-1" />
            {t('Checked In', '已签到')}
          </Badge>
        );
      case 'checked_out':
        return (
          <Badge variant="default" className="bg-gray-600/20 text-gray-400 border-gray-600/30">
            <LogOut className="h-3 w-3 mr-1" />
            {t('Checked Out', '已退房')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-cosmic-600/30 text-gray-400">
            {reservation.status}
          </Badge>
        );
    }
  };

  const getActionButtons = () => {
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
        {getStatusBadge()}
        {getActionButtons()}
      </div>
      
      {/* Show timestamps when available */}
      <div className="text-xs text-gray-500 space-y-1">
        {reservation.checked_in_at && (
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-400" />
            <span>
              {t('Checked in:', '签到时间:')} {format(new Date(reservation.checked_in_at), 'MMM d, yyyy HH:mm')}
            </span>
          </div>
        )}
        {reservation.checked_out_at && (
          <div className="flex items-center gap-1">
            <LogOut className="h-3 w-3 text-orange-400" />
            <span>
              {t('Checked out:', '退房时间:')} {format(new Date(reservation.checked_out_at), 'MMM d, yyyy HH:mm')}
            </span>
          </div>
        )}
        {reservation.host_notes && (
          <div className="text-gray-400 text-xs">
            <span className="font-medium">{t('Host Notes:', '主人备注:')}</span> {reservation.host_notes}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInOutManager;

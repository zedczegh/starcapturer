
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ReservationEditDialogProps {
  reservation: any;
  onClose: () => void;
  onUpdate: () => void;
}

const ReservationEditDialog: React.FC<ReservationEditDialogProps> = ({
  reservation,
  onClose,
  onUpdate
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(reservation.astro_spot_timeslots?.start_time)
  );

  const handleUpdateReservation = async () => {
    if (!selectedDate || !user) {
      toast.error(t('Please select a date', '请选择日期'));
      return;
    }

    try {
      setIsUpdating(true);

      // Get the original time from the timeslot
      const originalTime = new Date(reservation.astro_spot_timeslots.start_time);
      const originalEndTime = new Date(reservation.astro_spot_timeslots.end_time);
      
      // Create new dates with the selected date but original times
      const newStartTime = new Date(selectedDate);
      newStartTime.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);
      
      const newEndTime = new Date(selectedDate);
      newEndTime.setHours(originalEndTime.getHours(), originalEndTime.getMinutes(), 0, 0);

      // First, create a new timeslot for the new date
      const { data: newTimeslot, error: timeslotError } = await supabase.functions.invoke('call-rpc', {
        body: {
          function: 'insert_astro_spot_timeslot',
          params: {
            p_spot_id: reservation.astro_spot_timeslots.spot_id,
            p_creator_id: reservation.astro_spot_timeslots.creator_id,
            p_start_time: newStartTime.toISOString(),
            p_end_time: newEndTime.toISOString(),
            p_max_capacity: reservation.astro_spot_timeslots.max_capacity,
            p_description: reservation.astro_spot_timeslots.description,
            p_price: reservation.astro_spot_timeslots.price || 0,
            p_currency: reservation.astro_spot_timeslots.currency || '$',
            p_pets_policy: reservation.astro_spot_timeslots.pets_policy || 'not_allowed'
          }
        }
      });

      if (timeslotError) throw timeslotError;

      // Update the reservation to point to the new timeslot
      const { error: reservationError } = await supabase
        .from('astro_spot_reservations')
        .update({ timeslot_id: newTimeslot.data })
        .eq('id', reservation.id)
        .eq('user_id', user.id);

      if (reservationError) throw reservationError;

      toast.success(t('Reservation updated successfully', '预订更新成功'));
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating reservation:', error);
      toast.error(t('Failed to update reservation', '更新预订失败'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-cosmic-800 border-cosmic-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {t('Edit Reservation Date', '编辑预订日期')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-gray-300 text-sm mb-2">
              {t('Current Date', '当前日期')}: {format(new Date(reservation.astro_spot_timeslots?.start_time), 'MMM d, yyyy')}
            </p>
            <p className="text-gray-300 text-sm mb-4">
              {t('Select new date', '选择新日期')}:
            </p>
            
            <div className="bg-cosmic-900/50 rounded-lg p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border-cosmic-700"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isUpdating}>
              {t('Cancel', '取消')}
            </Button>
            <Button 
              onClick={handleUpdateReservation} 
              disabled={isUpdating || !selectedDate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('Updating...', '更新中...')}
                </>
              ) : (
                t('Update Reservation', '更新预订')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationEditDialog;

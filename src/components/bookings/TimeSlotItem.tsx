import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import TimeSlotForm from './TimeSlotForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Calendar, Clock, User, X } from 'lucide-react';

interface TimeSlotItemProps {
  timeSlot: any;
  isCreator: boolean;
  onUpdate: () => void;
}

const TimeSlotItem: React.FC<TimeSlotItemProps> = ({ timeSlot, isCreator, onUpdate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Check if current user has a reservation for this time slot
  const userReservation = timeSlot.astro_spot_reservations?.find(
    (res: any) => res.user_id === user?.id
  );
  
  const hasBooked = !!userReservation;
  
  // Count confirmed reservations
  const confirmedReservations = timeSlot.astro_spot_reservations?.filter(
    (res: any) => res.status === 'confirmed'
  ) || [];
  
  const isSlotFull = confirmedReservations.length >= timeSlot.max_capacity;
  
  const formattedStartDate = format(parseISO(timeSlot.start_time), 'EEEE, MMMM d');
  const formattedStartTime = format(parseISO(timeSlot.start_time), 'h:mm a');
  const formattedEndTime = format(parseISO(timeSlot.end_time), 'h:mm a');

  const handleBookSlot = async () => {
    if (!user?.id) {
      toast.error(t("Please sign in to book", "请登录后预订"));
      return;
    }
    
    setIsBooking(true);
    
    try {
      // Use the Edge Function to call RPC
      const { data, error } = await supabase.functions.invoke('call-rpc', {
        body: {
          function: 'insert_astro_spot_reservation',
          params: {
            p_timeslot_id: timeSlot.id,
            p_user_id: user.id,
            p_status: 'confirmed'
          }
        }
      });

      if (error) throw error;
      
      toast.success(t("Booking confirmed!", "预订已确认！"));
      onUpdate();
    } catch (error) {
      console.error("Error booking time slot:", error);
      toast.error(t("Failed to book time slot", "预订时间段失败"));
    } finally {
      setIsBooking(false);
    }
  };
  
  const handleCancelBooking = async () => {
    if (!userReservation) return;
    
    setIsCancelling(true);
    
    try {
      // Use fetch to make a direct delete request to the supabase API
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch(
        `https://fmnivvwpyriufxaebbzi.supabase.co/rest/v1/astro_spot_reservations?id=eq.${userReservation.id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbml2dndweXJpdWZ4YWViYnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3ODU3NTAsImV4cCI6MjA2MDM2MTc1MH0.HZX_hS0A1nUB3iO7wDmTjMBoYk3hQz6lqmyBEYvoQ9Y',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
        
      if (!response.ok) throw new Error('Failed to cancel reservation');
      
      toast.success(t("Booking cancelled", "预订已取消"));
      onUpdate();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error(t("Failed to cancel booking", "取消预订失败"));
    } finally {
      setIsCancelling(false);
    }
  };
  
  const handleDeleteTimeSlot = async () => {
    try {
      // Use fetch to make a direct delete request to the supabase API
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch(
        `https://fmnivvwpyriufxaebbzi.supabase.co/rest/v1/astro_spot_timeslots?id=eq.${timeSlot.id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbml2dndweXJpdWZ4YWViYnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3ODU3NTAsImV4cCI6MjA2MDM2MTc1MH0.HZX_hS0A1nUB3iO7wDmTjMBoYk3hQz6lqmyBEYvoQ9Y',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
        
      if (!response.ok) throw new Error('Failed to delete time slot');
      
      toast.success(t("Time slot deleted", "时间段已删除"));
      onUpdate();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting time slot:", error);
      toast.error(t("Failed to delete time slot", "删除时间段失败"));
    }
  };
  
  const handleEditSuccess = () => {
    setShowEditForm(false);
    onUpdate();
    toast.success(t("Time slot updated", "时间段已更新"));
  };

  return (
    <>
      <div className="bg-cosmic-800/20 border border-cosmic-700/30 rounded-lg p-4 transition-all hover:bg-cosmic-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="space-y-2">
            <h4 className="text-md font-medium text-gray-200 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-blue-400" />
              {formattedStartDate}
            </h4>
            <div className="flex items-center text-gray-300">
              <Clock className="h-4 w-4 mr-2 text-blue-300" />
              {formattedStartTime} - {formattedEndTime}
            </div>
            <div className="flex items-center text-gray-300">
              <User className="h-4 w-4 mr-2 text-blue-300" />
              {t("Capacity", "容量")}: {confirmedReservations.length}/{timeSlot.max_capacity}
              
              {confirmedReservations.length > 0 && isCreator && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowParticipants(true)}
                  className="ml-2 text-xs text-primary h-6"
                >
                  {t("View participants", "查看参与者")}
                </Button>
              )}
            </div>
            {timeSlot.description && (
              <p className="text-sm text-gray-400 mt-1">{timeSlot.description}</p>
            )}
          </div>
          
          <div className="flex flex-col md:items-end gap-2 mt-4 md:mt-0">
            <div className="flex flex-wrap gap-2">
              {isSlotFull ? (
                <Badge variant="outline" className="bg-red-500/20 text-red-300 border-red-600/30">
                  {t("Fully Booked", "已满")}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-600/30">
                  {t("Available", "可用")}
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {/* User booking controls */}
              {!isCreator && !hasBooked && (
                <Button
                  size="sm"
                  disabled={isBooking || isSlotFull}
                  onClick={handleBookSlot}
                  className={isSlotFull ? "opacity-50" : ""}
                >
                  {isBooking ? t("Booking...", "预订中...") : t("Book Spot", "预订")}
                </Button>
              )}
              
              {!isCreator && hasBooked && (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isCancelling}
                  onClick={handleCancelBooking}
                >
                  {isCancelling ? t("Cancelling...", "取消中...") : t("Cancel Booking", "取消预订")}
                </Button>
              )}
              
              {/* Creator management controls */}
              {isCreator && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEditForm(true)}
                  >
                    {t("Edit", "编辑")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    {t("Delete", "删除")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit form dialog */}
      {showEditForm && (
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="bg-cosmic-900 border-cosmic-700 text-gray-100">
            <DialogHeader>
              <DialogTitle>{t("Edit Time Slot", "编辑时间段")}</DialogTitle>
            </DialogHeader>
            <TimeSlotForm
              spotId={timeSlot.spot_id}
              existingTimeSlot={timeSlot}
              onSuccess={handleEditSuccess}
              onCancel={() => setShowEditForm(false)}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-cosmic-900 border-cosmic-700 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Delete Time Slot", "删除时间段")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {t("Are you sure you want to delete this time slot? All reservations will be cancelled. This action cannot be undone.", 
                "您确定要删除此时间段吗？所有预订将被取消。此操作无法撤消。")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-cosmic-800 text-gray-200 hover:bg-cosmic-700">
              {t("Cancel", "取消")}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTimeSlot}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("Delete", "删除")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Participants dialog */}
      <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
        <DialogContent className="bg-cosmic-900 border-cosmic-700 text-gray-100">
          <DialogHeader>
            <DialogTitle>{t("Participants", "参与者")}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-2 max-h-[50vh] overflow-y-auto">
            {confirmedReservations.length > 0 ? (
              confirmedReservations.map((reservation: any) => (
                <div 
                  key={reservation.id}
                  className="flex items-center justify-between bg-cosmic-800/50 p-3 rounded-md border border-cosmic-700/30"
                >
                  <span className="text-gray-200">
                    {reservation.profiles?.username || t("Anonymous User", "匿名用户")}
                  </span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(reservation.created_at), 'MMM d, HH:mm')}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">
                  {t("No participants yet", "暂无参与者")}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TimeSlotItem;

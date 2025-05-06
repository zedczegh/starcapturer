
import { useState } from 'react';
import { formatISO } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TimeSlotSubmitParams {
  user: any;
  spotId: string;
  selectedDates: Date[];
  startTime: string;
  endTime: string;
  maxCapacity: number;
  description: string;
  isEditing: boolean;
  existingTimeSlot: any;
  initialDate: Date;
  setIsSubmitting: (isSubmitting: boolean) => void;
  onSuccess: () => void;
  t: (english: string, chinese: string) => string;
}

export const useTimeSlotSubmit = ({
  user,
  spotId,
  selectedDates,
  startTime,
  endTime,
  maxCapacity,
  description,
  isEditing,
  existingTimeSlot,
  initialDate,
  setIsSubmitting,
  onSuccess,
  t
}: TimeSlotSubmitParams) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t("You must be logged in to create time slots", "您必须登录才能创建时间段"));
      return;
    }

    if (selectedDates.length === 0) {
      toast.error(t("Please select at least one date", "请至少选择一个日期"));
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        // Handle editing a single time slot
        const [hours, minutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        
        const date = new Date(selectedDates[0]);
        date.setHours(hours, minutes, 0, 0);
        
        const endDate = new Date(selectedDates[0]);
        endDate.setHours(endHours, endMinutes, 0, 0);
        
        // Handle overnight sessions
        if (endHours < hours || (endHours === hours && endMinutes < minutes)) {
          endDate.setDate(endDate.getDate() + 1);
        }
        
        const { error } = await supabase
          .from('astro_spot_timeslots')
          .update({
            start_time: formatISO(date),
            end_time: formatISO(endDate),
            max_capacity: maxCapacity,
            description: description || null,
          })
          .eq('id', existingTimeSlot.id);
        
        if (error) throw error;
        
        toast.success(t("Time slot updated successfully", "时间段更新成功"), {
          description: t("Your changes have been saved", "您的更改已保存")
        });
      } else {
        // Handle creating multiple time slots
        const timeSlots = selectedDates.map(date => {
          const [hours, minutes] = startTime.split(':').map(Number);
          const [endHours, endMinutes] = endTime.split(':').map(Number);
          
          const startDateTime = new Date(date);
          startDateTime.setHours(hours, minutes, 0, 0);
          
          const endDateTime = new Date(date);
          endDateTime.setHours(endHours, endMinutes, 0, 0);
          
          // Handle overnight sessions
          if (endHours < hours || (endHours === hours && endMinutes < minutes)) {
            endDateTime.setDate(endDateTime.getDate() + 1);
          }
          
          return {
            spot_id: spotId,
            creator_id: user.id, // Added creator_id which was missing
            start_time: formatISO(startDateTime),
            end_time: formatISO(endDateTime),
            max_capacity: maxCapacity,
            description: description || null,
          };
        });
        
        const { error } = await supabase
          .from('astro_spot_timeslots')
          .insert(timeSlots);
        
        if (error) throw error;
        
        toast.success(
          t("Time slots created successfully", "时间段创建成功"), 
          {
            description: t(`${selectedDates.length} time slots have been added`, `已添加 ${selectedDates.length} 个时间段`)
          }
        );
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error submitting time slot:", error);
      toast.error(t("Failed to save time slot", "保存时间段失败"), {
        description: (error as Error).message
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return handleSubmit;
};

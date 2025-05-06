
import { toast } from 'sonner';
import { format, isSameDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { formatDateForLanguage } from '@/utils/dateFormatting';
import type { Language } from '@/contexts/LanguageContext';

interface TimeSlotSubmitProps {
  user: any;
  spotId: string;
  selectedDates: Date[];
  startTime: string;
  endTime: string;
  maxCapacity: number;
  description: string;
  isEditing: boolean;
  existingTimeSlot?: any;
  initialDate: Date;
  setIsSubmitting: (value: boolean) => void;
  onSuccess: () => void;
  t: (english: string, chinese: string) => string;
}

export function useTimeSlotSubmit({
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
}: TimeSlotSubmitProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !spotId) {
      toast.error(t("Authentication required", "需要登录"));
      return;
    }
    
    // Even with the effect above, we'll add an extra check here for safety
    if (selectedDates.length === 0) {
      // Auto-select today's date if no date is selected
      const today = new Date();
      toast.info(t("Today's date was automatically selected", "已自动选择今天的日期"));
      return; // Let the user review the auto-selected date before submitting
    }
    
    setIsSubmitting(true);
    
    try {
      // Parse the time strings
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const createTimeSlotsPromises = selectedDates.map(async (selectedDate) => {
        const startDateTime = new Date(selectedDate);
        startDateTime.setHours(startHour, startMinute, 0, 0);
        
        const endDateTime = new Date(selectedDate);
        endDateTime.setHours(endHour, endMinute, 0, 0);
        
        // If end time is earlier than start time, assume it's the next day
        if (endDateTime <= startDateTime) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }
        
        if (isEditing && isSameDay(selectedDate, initialDate)) {
          // Update the existing time slot if it's on the initial date
          return supabase.functions.invoke('call-rpc', {
            body: {
              function: 'update_astro_spot_timeslot',
              params: {
                p_id: existingTimeSlot.id,
                p_spot_id: spotId,
                p_creator_id: user.id,
                p_start_time: startDateTime.toISOString(),
                p_end_time: endDateTime.toISOString(),
                p_max_capacity: maxCapacity,
                p_description: description.trim()
              }
            }
          });
        } else {
          // Create a new time slot for this date
          return supabase.functions.invoke('call-rpc', {
            body: {
              function: 'insert_astro_spot_timeslot',
              params: {
                p_spot_id: spotId,
                p_creator_id: user.id,
                p_start_time: startDateTime.toISOString(),
                p_end_time: endDateTime.toISOString(),
                p_max_capacity: maxCapacity,
                p_description: description.trim()
              }
            }
          });
        }
      });
      
      const results = await Promise.all(createTimeSlotsPromises);
      
      // Check if any operations failed
      const errors = results.filter(result => result.error).map(result => result.error);
      if (errors.length > 0) {
        console.error("Errors creating time slots:", errors);
        throw new Error(t("Some time slots could not be created", "部分时间段无法创建"));
      }
      
      if (selectedDates.length > 1) {
        toast.success(
          t(
            `${selectedDates.length} time slots have been created successfully`, 
            `已成功创建 ${selectedDates.length} 个时间段`
          )
        );
      } else {
        toast.success(
          isEditing 
            ? t("Time slot updated successfully", "时间段已成功更新") 
            : t("Time slot created successfully", "时间段已成功创建")
        );
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving time slots:", error);
      toast.error(t("Failed to save time slots", "保存时间段失败"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return handleSubmit;
}

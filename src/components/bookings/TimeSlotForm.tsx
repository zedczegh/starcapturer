
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format, compareAsc, eachDayOfInterval, isSameDay } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TimeSlotCalendar from './TimeSlotCalendar';
import TimeSlotDatesDisplay from './TimeSlotDatesDisplay';
import TimeSlotDetailsForm from './TimeSlotDetailsForm';

interface TimeSlotFormProps {
  spotId: string;
  onSuccess: () => void;
  onCancel: () => void;
  existingTimeSlot?: any;
}

const TimeSlotForm: React.FC<TimeSlotFormProps> = ({ 
  spotId, 
  onSuccess, 
  onCancel,
  existingTimeSlot 
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditing = !!existingTimeSlot;
  const initialDate = isEditing ? new Date(existingTimeSlot.start_time) : new Date();
  
  const [selectedDates, setSelectedDates] = useState<Date[]>([initialDate]);
  const [startTime, setStartTime] = useState(isEditing ? 
    format(new Date(existingTimeSlot.start_time), 'HH:mm') : '20:00');
  const [endTime, setEndTime] = useState(isEditing ? 
    format(new Date(existingTimeSlot.end_time), 'HH:mm') : '23:00');
  const [description, setDescription] = useState(isEditing ? 
    existingTimeSlot.description || '' : '');
  const [maxCapacity, setMaxCapacity] = useState(isEditing ? 
    existingTimeSlot.max_capacity : 1);
  const [petsPolicy, setPetsPolicy] = useState(isEditing ?
    existingTimeSlot.pets_policy || 'not_allowed' : 'not_allowed');
  const [price, setPrice] = useState(isEditing ? 
    existingTimeSlot.price || 0 : 0);
  const [currency, setCurrency] = useState(isEditing ? 
    existingTimeSlot.currency || '$' : '$');
  
  // Track selection state for range selection
  const [selectionMode, setSelectionMode] = useState<'start' | 'end'>('start');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Handle date selection with improved range functionality
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Clear existing selection if we're starting a new range
    if (selectionMode === 'start') {
      setStartDate(date);
      setEndDate(null);
      setSelectionMode('end');
      setSelectedDates([date]); // Start with just this date selected
      return;
    }
    
    // Complete the range selection
    if (selectionMode === 'end' && startDate) {
      setEndDate(date);
      
      // Ensure start date is before end date
      const [rangeStart, rangeEnd] = compareAsc(startDate, date) <= 0 
        ? [startDate, date] 
        : [date, startDate];
      
      // Generate all dates in the selected range
      const dateRange = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
      setSelectedDates(dateRange);
      setSelectionMode('start'); // Reset for next selection
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !spotId) {
      toast.error(t("Authentication required", "需要登录"));
      return;
    }
    
    if (selectedDates.length === 0) {
      toast.error(t("Please select at least one date", "请至少选择一个日期"));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Process each selected date
      for (const selectedDate of selectedDates) {
        // Parse the date and times
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        const startDateTime = new Date(selectedDate);
        startDateTime.setHours(startHour, startMinute, 0, 0);
        
        const endDateTime = new Date(selectedDate);
        endDateTime.setHours(endHour, endMinute, 0, 0);
        
        // Check that end time is after start time
        if (endDateTime <= startDateTime) {
          if (endHour < startHour) {
            // Assume end time is next day if hours indicate so
            endDateTime.setDate(endDateTime.getDate() + 1);
          } else {
            toast.error(t("End time must be after start time", "结束时间必须晚于开始时间"));
            setIsSubmitting(false);
            return;
          }
        }
        
        if (isEditing) {
          // Call the edge function to update the time slot
          const { data, error } = await supabase.functions.invoke('call-rpc', {
            body: {
              function: 'update_astro_spot_timeslot',
              params: {
                p_id: existingTimeSlot.id,
                p_spot_id: spotId,
                p_creator_id: user.id,
                p_start_time: startDateTime.toISOString(),
                p_end_time: endDateTime.toISOString(),
                p_max_capacity: maxCapacity,
                p_description: description.trim(),
                p_pets_policy: petsPolicy,
                p_price: price,
                p_currency: currency
              }
            }
          });

          if (error) throw error;
        } else {
          // Call the edge function to create a new time slot
          const { data, error } = await supabase.functions.invoke('call-rpc', {
            body: {
              function: 'insert_astro_spot_timeslot',
              params: {
                p_spot_id: spotId,
                p_creator_id: user.id,
                p_start_time: startDateTime.toISOString(),
                p_end_time: endDateTime.toISOString(),
                p_max_capacity: maxCapacity,
                p_description: description.trim(),
                p_pets_policy: petsPolicy,
                p_price: price,
                p_currency: currency
              }
            }
          });

          if (error) throw error;
        }
      }
      
      toast.success(isEditing 
        ? t("Time slot updated", "时间段已更新") 
        : t("Time slots created", "时间段已创建"));
      onSuccess();
    } catch (error) {
      console.error("Error saving time slot:", error);
      toast.error(t("Failed to save time slot", "保存时间段失败"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to determine if a date is the start or end of the current range
  const isRangeStartOrEnd = (date: Date) => {
    return (startDate && isSameDay(date, startDate)) || 
           (endDate && isSameDay(date, endDate));
  };

  // Helper to determine if a date is within the current selection range
  const isInSelectionRange = (date: Date) => {
    if (!startDate) return false;
    if (endDate) {
      const [rangeStart, rangeEnd] = compareAsc(startDate, endDate) <= 0 
        ? [startDate, endDate] 
        : [endDate, startDate];
      return compareAsc(date, rangeStart) >= 0 && compareAsc(date, rangeEnd) <= 0;
    }
    return false;
  };

  return (
    <div className="bg-cosmic-800/50 border border-cosmic-700/30 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-medium text-gray-200 mb-3">
        {isEditing 
          ? t("Edit Time Slot", "编辑时间段") 
          : t("Add New Time Slot", "添加新时间段")
        }
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date" className="block text-sm text-gray-300 mb-1">
              {t("Select Dates", "选择日期")} 
              <span className="text-xs text-gray-400 ml-1">
                {selectionMode === 'start' 
                  ? t("(Select start date)", "(选择开始日期)") 
                  : t("(Select end date)", "(选择结束日期)")}
              </span>
            </Label>
            
            <TimeSlotCalendar 
              selectedDates={selectedDates}
              onDateSelect={handleDateSelect}
              startDate={startDate}
              endDate={endDate}
              selectionMode={selectionMode}
              isRangeStartOrEnd={isRangeStartOrEnd}
              isInSelectionRange={isInSelectionRange}
            />
            
            <TimeSlotDatesDisplay selectedDates={selectedDates} />
          </div>
          
          <TimeSlotDetailsForm
            startTime={startTime}
            endTime={endTime}
            maxCapacity={maxCapacity}
            petsPolicy={petsPolicy}
            price={price}
            currency={currency}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            onMaxCapacityChange={setMaxCapacity}
            onPetsPolicyChange={setPetsPolicy}
            onPriceChange={setPrice}
            onCurrencyChange={setCurrency}
          />
        </div>
        
        <div>
          <Label htmlFor="description" className="block text-sm text-gray-300 mb-1">
            {t("Description (optional)", "描述（可选）")}
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("Add any special instructions or details...", "添加任何特殊说明或细节...")}
            className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200 h-24"
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t("Cancel", "取消")}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Saving...", "保存中...")}
              </>
            ) : isEditing ? t("Update", "更新") : t("Create", "创建")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TimeSlotForm;

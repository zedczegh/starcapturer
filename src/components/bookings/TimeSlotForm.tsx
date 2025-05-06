
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, isSameDay, isAfter, isBefore, eachDayOfInterval } from 'date-fns';
import { Loader2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  
  const [selectedDates, setSelectedDates] = useState<Date[]>(isEditing ? [initialDate] : [new Date()]);
  const [lastSelectedDate, setLastSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState(isEditing ? 
    format(new Date(existingTimeSlot.start_time), 'HH:mm') : '20:00');
  const [endTime, setEndTime] = useState(isEditing ? 
    format(new Date(existingTimeSlot.end_time), 'HH:mm') : '23:00');
  const [description, setDescription] = useState(isEditing ? 
    existingTimeSlot.description || '' : '');
  const [maxCapacity, setMaxCapacity] = useState(isEditing ? 
    existingTimeSlot.max_capacity : 1);

  // Effect to ensure at least one date is selected
  useEffect(() => {
    if (selectedDates.length === 0) {
      setSelectedDates([new Date()]);
    }
  }, [selectedDates]);

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
      setSelectedDates([today]);
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

  const handleCalendarSelect = (dates: Date[] | undefined) => {
    if (!dates || dates.length === 0) {
      // Auto-select today's date if the user cleared all dates
      setSelectedDates([new Date()]);
      setLastSelectedDate(null);
      toast.info(t("Today's date was automatically selected", "已自动选择今天的日期"));
      return;
    }

    // If this is a range selection scenario
    if (lastSelectedDate && dates.length === 1 && !isSameDay(lastSelectedDate, dates[0])) {
      // Determine start and end of the range
      const startDate = isBefore(lastSelectedDate, dates[0]) ? lastSelectedDate : dates[0];
      const endDate = isAfter(lastSelectedDate, dates[0]) ? lastSelectedDate : dates[0];
      
      // Create an array of all dates in the range
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Set all dates in the range as selected
      setSelectedDates(dateRange);
      toast.info(t("Date range selected", "已选择日期范围"));
      setLastSelectedDate(null);
    } else {
      // Normal selection behavior
      setSelectedDates(dates);
      setLastSelectedDate(dates.length === 1 ? dates[0] : null);
    }
  };

  const removeDateBadge = (dateToRemove: Date) => {
    const newDates = selectedDates.filter(date => 
      !isSameDay(date, dateToRemove)
    );
    
    if (newDates.length === 0) {
      // Auto-select today's date if the user removes the last date
      setSelectedDates([new Date()]);
      setLastSelectedDate(null);
      toast.info(t("Today's date was automatically selected", "已自动选择今天的日期"));
    } else {
      setSelectedDates(newDates);
      setLastSelectedDate(null);
    }
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
              {isEditing
                ? t("Date", "日期")
                : t("Select Dates", "选择日期")
              }
              <span className="text-xs ml-1 text-gray-400">
                {isEditing ? "" : t("(select two dates to create a range)", "（选择两个日期创建范围）")}
              </span>
            </Label>
            <div className="bg-cosmic-900/40 rounded-lg border border-cosmic-700/40 p-2">
              {isEditing ? (
                <Calendar
                  mode="single"
                  selected={selectedDates[0]}
                  onSelect={(date) => date && setSelectedDates([date])}
                  disabled={(date) => date < new Date()}
                  className="bg-cosmic-800/30 rounded-lg"
                />
              ) : (
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={handleCalendarSelect}
                  disabled={(date) => date < new Date()}
                  className="bg-cosmic-800/30 rounded-lg"
                />
              )}
            </div>
            
            {!isEditing && selectedDates.length > 0 && (
              <div className="mt-2">
                <Label className="block text-sm text-gray-300 mb-1">
                  {t("Selected Dates", "已选择日期")} ({selectedDates.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedDates.map((date, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="pl-2 pr-1 py-1 flex items-center gap-1 bg-cosmic-800/60"
                    >
                      {format(date, 'MMM dd, yyyy')}
                      <Button 
                        type="button"
                        size="icon" 
                        variant="ghost" 
                        className="h-5 w-5 ml-1 rounded-full hover:bg-cosmic-700/50"
                        onClick={() => removeDateBadge(date)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                {lastSelectedDate && (
                  <p className="text-xs text-primary mt-2">
                    {t("Select another date to create a range", "选择另一个日期创建范围")}
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="start-time" className="block text-sm text-gray-300 mb-1">
                {t("Start Time", "开始时间")}
              </Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="end-time" className="block text-sm text-gray-300 mb-1">
                {t("End Time", "结束时间")}
              </Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                {t("For overnight sessions, set end time earlier than start time", "对于通宵会话，请将结束时间设置为早于开始时间")}
              </p>
            </div>
            
            <div>
              <Label htmlFor="capacity" className="block text-sm text-gray-300 mb-1">
                {t("Maximum Capacity", "最大容量")}
              </Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="100"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(parseInt(e.target.value))}
                className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200"
                required
              />
            </div>
          </div>
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
            disabled={isSubmitting || selectedDates.length === 0}
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

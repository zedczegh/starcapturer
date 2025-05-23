
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format, addHours, setHours, setMinutes, eachDayOfInterval, isBefore } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TimeSlotCalendar from './TimeSlotCalendar';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

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
  
  // State for multiple date selection mode
  const [selectedDates, setSelectedDates] = useState<Date[]>([initialDate]);
  
  // State for range selection mode
  const [rangeStart, setRangeStart] = useState<Date | undefined>(undefined);
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>(undefined);
  
  // Toggle between date selection modes
  const [useRangeMode, setUseRangeMode] = useState(false);
  
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

  // Handle date range selection
  const handleRangeSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    setRangeStart(range.from);
    setRangeEnd(range.to);
  };

  // Convert range to array of dates for processing
  const getSelectedDatesFromRange = (): Date[] => {
    if (!rangeStart) return [];
    
    const end = rangeEnd || rangeStart;
    
    // Get all days in the range
    return eachDayOfInterval({
      start: rangeStart,
      end
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !spotId) {
      toast.error(t("Authentication required", "需要登录"));
      return;
    }
    
    // Get dates based on the selection mode
    const datesToProcess = useRangeMode ? getSelectedDatesFromRange() : selectedDates;
    
    if (datesToProcess.length === 0) {
      toast.error(t("Please select at least one date", "请至少选择一个日期"));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Process each selected date
      for (const selectedDate of datesToProcess) {
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
                p_price: 0,
                p_currency: '$',
                p_pets_policy: petsPolicy
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
                p_price: 0,
                p_currency: '$',
                p_pets_policy: petsPolicy
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
    } catch (error: any) {
      console.error("Error saving time slot:", error);
      const errorMessage = error.message || t("Failed to save time slot", "保存时间段失败");
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
        <div className="flex items-center space-x-2 mb-2">
          <Switch
            id="range-mode"
            checked={useRangeMode}
            onCheckedChange={setUseRangeMode}
          />
          <Label htmlFor="range-mode" className="text-sm text-gray-300">
            {t("Use date range selection", "使用日期范围选择")}
          </Label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date" className="block text-sm text-gray-300 mb-1">
              {useRangeMode 
                ? t("Select Date Range", "选择日期范围")
                : t("Select Dates", "选择日期") + " " +
                  t("(Choose multiple dates)", "(可选择多个日期)")
              }
            </Label>
            <div className="bg-cosmic-900/40 rounded-lg border border-cosmic-700/40 p-2">
              <TimeSlotCalendar
                mode={useRangeMode ? 'range' : 'multiple'}
                selectedDates={selectedDates}
                onSelect={setSelectedDates}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onRangeChange={handleRangeSelect}
                className="bg-cosmic-800/30 rounded-lg"
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {useRangeMode ? (
                rangeStart ? (
                  <>
                    {t("Selected range", "已选择范围")}: {format(rangeStart, 'yyyy-MM-dd')}
                    {rangeEnd && rangeEnd !== rangeStart ? ` ${t("to", "至")} ${format(rangeEnd, 'yyyy-MM-dd')}` : ""}
                    {rangeStart && rangeEnd ? ` (${getSelectedDatesFromRange().length} ${t("days", "天")})` : ""}
                  </>
                ) : t("No date range selected", "未选择日期范围")
              ) : (
                `${t("Selected dates", "已选择日期")}: ${selectedDates.length}`
              )}
            </div>
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

            <div>
              <Label htmlFor="pets-policy" className="block text-sm text-gray-300 mb-1">
                {t("Pets Policy", "宠物政策")}
              </Label>
              <Select 
                value={petsPolicy} 
                onValueChange={setPetsPolicy}
              >
                <SelectTrigger className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200">
                  <SelectValue placeholder={t("Select pets policy", "选择宠物政策")} />
                </SelectTrigger>
                <SelectContent className="bg-cosmic-800 border-cosmic-700">
                  <SelectItem value="not_allowed">{t("Not Allowed", "不允许")}</SelectItem>
                  <SelectItem value="allowed">{t("Allowed", "允许")}</SelectItem>
                  <SelectItem value="only_small">{t("Only Small Pets", "仅小型宠物")}</SelectItem>
                  <SelectItem value="approval_required">{t("Host Approval Required", "需要主人批准")}</SelectItem>
                </SelectContent>
              </Select>
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

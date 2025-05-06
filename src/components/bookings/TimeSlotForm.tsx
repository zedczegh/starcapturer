import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useDateSelection } from '@/hooks/useDateSelection';
import { useTimeSlotSubmit } from '@/hooks/useTimeSlotSubmit';
import DateSelectionArea from './DateSelectionArea';
import TimeCapacityInputs from './TimeCapacityInputs';

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
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const isEditing = !!existingTimeSlot;
  const initialDate = isEditing ? new Date(existingTimeSlot.start_time) : new Date();
  
  const {
    selectedDates,
    setSelectedDates,
    handleCalendarSelect,
    removeDateBadge,
    selectAll,
    deleteAll
  } = useDateSelection(isEditing, initialDate);

  const [startTime, setStartTime] = useState(isEditing ? 
    format(new Date(existingTimeSlot.start_time), 'HH:mm') : '20:00');
  const [endTime, setEndTime] = useState(isEditing ? 
    format(new Date(existingTimeSlot.end_time), 'HH:mm') : '23:00');
  const [description, setDescription] = useState(isEditing ? 
    existingTimeSlot.description || '' : '');
  const [maxCapacity, setMaxCapacity] = useState(isEditing ? 
    existingTimeSlot.max_capacity : 1);
  
  const handleSubmit = useTimeSlotSubmit({
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
  });

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
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
                {isEditing ? "" : t("(select a date to create a range from today)", "（选择一个日期创建从今天开始的范围）")}
              </span>
            </Label>

            {!isEditing && (
              <div className="flex flex-wrap gap-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => selectAll(currentMonth)}
                  className="flex items-center gap-1 text-xs bg-cosmic-800/70"
                >
                  <SelectAll className="h-3.5 w-3.5" />
                  {t("Select All", "全选")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={deleteAll}
                  className="flex items-center gap-1 text-xs bg-cosmic-800/70"
                >
                  <CalendarX className="h-3.5 w-3.5" />
                  {t("Clear All", "清除全部")}
                </Button>
              </div>
            )}

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
                  onMonthChange={handleMonthChange}
                />
              )}
            </div>
            
            {!isEditing && selectedDates.length > 0 && (
              <div className="mt-2">
                <Label className="block text-sm text-gray-300 mb-1">
                  {t("Selected Dates", "已选择日期")} ({selectedDates.length})
                </Label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
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

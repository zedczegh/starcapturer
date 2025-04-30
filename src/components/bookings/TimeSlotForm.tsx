import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, addHours, setHours, setMinutes, isSameDay, isAfter, isBefore } from 'date-fns';
import { Loader2, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [selectionMode, setSelectionMode] = useState('single');
  
  const isEditing = !!existingTimeSlot;
  const initialDate = isEditing ? new Date(existingTimeSlot.start_time) : new Date();
  
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedDates, setSelectedDates] = useState<Date[]>([initialDate]);
  const [duration, setDuration] = useState('3');
  const [startTime, setStartTime] = useState(isEditing ? 
    format(new Date(existingTimeSlot.start_time), 'HH:mm') : '20:00');
  const [endTime, setEndTime] = useState(isEditing ? 
    format(new Date(existingTimeSlot.end_time), 'HH:mm') : '23:00');
  const [description, setDescription] = useState(isEditing ? 
    existingTimeSlot.description || '' : '');
  const [maxCapacity, setMaxCapacity] = useState(isEditing ? 
    existingTimeSlot.max_capacity : 1);
  const [price, setPrice] = useState(isEditing ? 
    existingTimeSlot.price || 0 : 0);
  const [currency, setCurrency] = useState(isEditing ? 
    existingTimeSlot.currency || '$' : '$');

  // Track already booked dates to show in calendar
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  
  // Fetch existing bookings for this spot
  React.useEffect(() => {
    if (!spotId) return;
    
    const fetchExistingBookings = async () => {
      try {
        // Use fetch to directly access the Supabase API
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const response = await fetch(
          `https://fmnivvwpyriufxaebbzi.supabase.co/rest/v1/astro_spot_timeslots?spot_id=eq.${spotId}`,
          {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbml2dndweXJpdWZ4YWViYnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3ODU3NTAsImV4cCI6MjA2MDM2MTc1MH0.HZX_hS0A1nUB3iO7wDmTjMBoYk3hQz6lqmyBEYvoQ9Y',
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
          
        if (!response.ok) {
          console.error("Error fetching existing bookings:", response.statusText);
          return;
        }
        
        const data = await response.json();
        
        if (data) {
          // Extract all booked dates
          const dates = data.flatMap((slot: any) => {
            const start = new Date(slot.start_time);
            const end = new Date(slot.end_time);
            
            // If multi-day booking, include all days between start and end
            const result = [];
            let current = new Date(start);
            
            while (isBefore(current, end) || isSameDay(current, end)) {
              result.push(new Date(current));
              current.setDate(current.getDate() + 1);
            }
            
            return result;
          });
          
          setBookedDates(dates);
        }
      } catch (err) {
        console.error("Error loading bookings:", err);
      }
    };
    
    fetchExistingBookings();
  }, [spotId]);

  // Calendar date modifiers for booked dates
  const isDayBooked = (date: Date) => {
    return bookedDates.some(bookedDate => isSameDay(date, bookedDate));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !spotId) {
      toast.error(t("Authentication required", "需要登录"));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Parse the date and times
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      // Handle multiple dates or single date
      const datesToProcess = selectionMode === 'multiple' ? selectedDates : [selectedDate];
      
      let successCount = 0;
      
      // Create timeslots for each selected date
      for (const date of datesToProcess) {
        const startDateTime = new Date(date);
        startDateTime.setHours(startHour, startMinute, 0, 0);
        
        let endDateTime;
        if (selectionMode === 'duration') {
          // For duration mode, add the selected number of hours
          endDateTime = addHours(startDateTime, parseInt(duration));
        } else {
          // For single/multiple date selection, use the selected end time
          endDateTime = new Date(date);
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
        }
        
        // Add pricing information to the parameters
        const params = {
          ...(isEditing ? { p_id: existingTimeSlot.id } : {}),
          p_spot_id: spotId,
          p_creator_id: user.id,
          p_start_time: startDateTime.toISOString(),
          p_end_time: endDateTime.toISOString(),
          p_max_capacity: maxCapacity,
          p_description: description.trim(),
          p_price: price,
          p_currency: currency
        };

        // Call the edge function to create a new time slot
        const { data, error } = await supabase.functions.invoke('call-rpc', {
          body: {
            function: isEditing ? 'update_astro_spot_timeslot' : 'insert_astro_spot_timeslot',
            params: params
          }
        });

        if (error) {
          console.error("Error saving time slot:", error);
        } else {
          successCount++;
        }
      }
      
      if (successCount === 0) {
        toast.error(t("Failed to save time slots", "保存时间段失败"));
      } else if (successCount < datesToProcess.length) {
        toast.warning(
          t(`Saved ${successCount} out of ${datesToProcess.length} time slots`, 
             `已保存 ${successCount} 个时间段，共 ${datesToProcess.length} 个`)
        );
        onSuccess();
      } else {
        if (datesToProcess.length > 1) {
          toast.success(t(`Successfully created ${datesToProcess.length} time slots`, 
                         `成功创建了 ${datesToProcess.length} 个时间段`));
        } else {
          toast.success(t("Time slot saved successfully", "时间段保存成功"));
        }
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving time slot:", error);
      toast.error(t("Failed to save time slot", "保存时间段失败"));
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
        <Tabs 
          defaultValue="single" 
          value={selectionMode} 
          onValueChange={setSelectionMode}
          className="w-full"
        >
          <div className="mb-2">
            <Label className="block text-sm text-gray-300 mb-2">
              {t("Selection Mode", "选择模式")}
            </Label>
            <TabsList className="grid grid-cols-3 mb-4 bg-cosmic-800">
              <TabsTrigger value="single">
                {t("Single Day", "单日")}
              </TabsTrigger>
              <TabsTrigger value="multiple">
                {t("Multiple Days", "多日")}
              </TabsTrigger>
              <TabsTrigger value="duration">
                {t("Duration", "时长")}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="single" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="block text-sm text-gray-300 mb-1">
                {t("Date", "日期")}
              </Label>
              <div className="bg-cosmic-900/40 rounded-lg border border-cosmic-700/40 p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date < new Date() || isDayBooked(date)}
                  modifiers={{ booked: isDayBooked }}
                  modifiersClassNames={{
                    booked: "bg-red-600/20 text-gray-500 opacity-50"
                  }}
                  className="bg-cosmic-800/30 rounded-lg pointer-events-auto"
                />
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
                <Label htmlFor="price" className="block text-sm text-gray-300 mb-1">
                  {t("Price per Night", "每晚价格")}
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200 pl-10"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="multiple" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm text-gray-300 mb-1">
                {t("Select Multiple Dates", "选择多个日期")}
              </Label>
              <div className="bg-cosmic-900/40 rounded-lg border border-cosmic-700/40 p-2">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={setSelectedDates}
                  disabled={(date) => date < new Date() || isDayBooked(date)}
                  modifiers={{ booked: isDayBooked }}
                  modifiersClassNames={{
                    booked: "bg-red-600/20 text-gray-500 opacity-50"
                  }}
                  className="bg-cosmic-800/30 rounded-lg pointer-events-auto"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {t("Selected dates", "已选择日期")}: {selectedDates.length}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="start-time-multi" className="block text-sm text-gray-300 mb-1">
                  {t("Start Time (for all dates)", "开始时间（适用于所有日期）")}
                </Label>
                <Input
                  id="start-time-multi"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="end-time-multi" className="block text-sm text-gray-300 mb-1">
                  {t("End Time (for all dates)", "结束时间（适用于所有日期）")}
                </Label>
                <Input
                  id="end-time-multi"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="price" className="block text-sm text-gray-300 mb-1">
                  {t("Price per Night", "每晚价格")}
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="price-multi"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200 pl-10"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="duration" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm text-gray-300 mb-1">
                {t("Date", "日期")}
              </Label>
              <div className="bg-cosmic-900/40 rounded-lg border border-cosmic-700/40 p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date < new Date() || isDayBooked(date)}
                  modifiers={{ booked: isDayBooked }}
                  modifiersClassNames={{
                    booked: "bg-red-600/20 text-gray-500 opacity-50"
                  }}
                  className="bg-cosmic-800/30 rounded-lg pointer-events-auto"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="start-time-duration" className="block text-sm text-gray-300 mb-1">
                  {t("Start Time", "开始时间")}
                </Label>
                <Input
                  id="start-time-duration"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="duration" className="block text-sm text-gray-300 mb-1">
                  {t("Duration (hours)", "时长（小时）")}
                </Label>
                <Select 
                  value={duration} 
                  onValueChange={setDuration}
                >
                  <SelectTrigger className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200">
                    <SelectValue placeholder={t("Select duration", "选择时长")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 {t("hour", "小时")}</SelectItem>
                    <SelectItem value="2">2 {t("hours", "小时")}</SelectItem>
                    <SelectItem value="3">3 {t("hours", "小时")}</SelectItem>
                    <SelectItem value="4">4 {t("hours", "小时")}</SelectItem>
                    <SelectItem value="5">5 {t("hours", "小时")}</SelectItem>
                    <SelectItem value="6">6 {t("hours", "小时")}</SelectItem>
                    <SelectItem value="8">8 {t("hours", "小时")}</SelectItem>
                    <SelectItem value="12">12 {t("hours", "小时")}</SelectItem>
                    <SelectItem value="24">24 {t("hours", "小时")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="price" className="block text-sm text-gray-300 mb-1">
                  {t("Price per Night", "每晚价格")}
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="price-duration"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200 pl-10"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="currency" className="block text-sm text-gray-300 mb-1">
              {t("Currency", "货币")}
            </Label>
            <Select 
              value={currency} 
              onValueChange={setCurrency}
            >
              <SelectTrigger className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200">
                <SelectValue placeholder={t("Select currency", "选择货币")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$">USD ($)</SelectItem>
                <SelectItem value="€">EUR (€)</SelectItem>
                <SelectItem value="£">GBP (£)</SelectItem>
                <SelectItem value="¥">CNY (¥)</SelectItem>
                <SelectItem value="₹">INR (₹)</SelectItem>
              </SelectContent>
            </Select>
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

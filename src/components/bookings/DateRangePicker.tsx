
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDateForLanguage } from '@/utils/dateFormatting';
import { Card, CardContent } from '@/components/ui/card';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}) => {
  const { t, language } = useLanguage();
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);

  // Handle date selection for check-in
  const handleStartSelect = (date: Date | undefined) => {
    if (date) {
      onStartDateChange(date);
      setIsStartCalendarOpen(false);
      
      // If end date is before start date, clear it
      if (endDate && date > endDate) {
        onEndDateChange(null);
      }
    }
  };

  // Handle date selection for check-out
  const handleEndSelect = (date: Date | undefined) => {
    if (date) {
      // Ensure end date is not before start date
      if (startDate && date < startDate) {
        return;
      }
      onEndDateChange(date);
      setIsEndCalendarOpen(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Check-in date picker */}
      <div className="flex-1">
        <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              id="check-in-picker"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal border border-cosmic-700/40 bg-cosmic-800/20 hover:bg-cosmic-800/40",
                !startDate && "text-gray-500"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? (
                formatDateForLanguage(startDate, language)
              ) : (
                <span>{t("Check-in", "入住")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 bg-cosmic-800 border border-cosmic-700/40" 
            align="start"
          >
            <div className="p-3 border-b border-cosmic-700/30">
              <span className="text-sm font-medium">{t("Select check-in date", "选择入住日期")}</span>
            </div>
            <Calendar
              mode="single"
              selected={startDate || undefined}
              onSelect={handleStartSelect}
              initialFocus
              disabled={(date) => {
                // Disable dates in the past
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                return date < yesterday;
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Check-out date picker */}
      <div className="flex-1">
        <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              id="check-out-picker"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal border border-cosmic-700/40 bg-cosmic-800/20 hover:bg-cosmic-800/40",
                !endDate && "text-gray-500"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? (
                formatDateForLanguage(endDate, language)
              ) : (
                <span>{t("Check-out", "退房")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 bg-cosmic-800 border border-cosmic-700/40" 
            align="start"
          >
            <div className="p-3 border-b border-cosmic-700/30">
              <span className="text-sm font-medium">{t("Select check-out date", "选择退房日期")}</span>
            </div>
            <Calendar
              mode="single"
              selected={endDate || undefined}
              onSelect={handleEndSelect}
              initialFocus
              disabled={(date) => {
                // Disable dates in the past and dates before start date
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                return date < yesterday || (startDate && date < startDate);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default DateRangePicker;

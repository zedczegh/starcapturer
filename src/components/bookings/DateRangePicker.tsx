
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
import { formatDateRange } from '@/utils/dateFormatting';

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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateSelectionStep, setDateSelectionStep] = useState<'start' | 'end'>(
    !startDate ? 'start' : 'end'
  );

  // Handle date selection
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      if (dateSelectionStep === 'start') {
        onStartDateChange(date);
        setDateSelectionStep('end');
      } else {
        // Ensure end date is not before start date
        if (startDate && date < startDate) {
          onEndDateChange(null);
          onStartDateChange(date);
          setDateSelectionStep('end');
        } else {
          onEndDateChange(date);
          setIsCalendarOpen(false);
        }
      }
    }
  };

  // Reset selection
  const handleReset = () => {
    onStartDateChange(null);
    onEndDateChange(null);
    setDateSelectionStep('start');
  };

  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          id="date-range-picker"
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal border border-cosmic-700/40 bg-cosmic-800/20 hover:bg-cosmic-800/40",
            !startDate && !endDate && "text-gray-500"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {startDate || endDate ? (
            formatDateRange(startDate, endDate, language)
          ) : (
            <span>{t("Select dates", "选择日期")}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-cosmic-800 border border-cosmic-700/40" 
        align="start"
      >
        <div className="p-3 border-b border-cosmic-700/30 flex items-center justify-between">
          <span className="text-sm font-medium">
            {dateSelectionStep === 'start' 
              ? t("Select check-in date", "选择入住日期")
              : t("Select check-out date", "选择退房日期")}
          </span>
          {(startDate || endDate) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReset} 
              className="text-xs text-primary"
            >
              {t("Reset", "重置")}
            </Button>
          )}
        </div>
        <Calendar
          mode="single"
          selected={dateSelectionStep === 'start' ? startDate || undefined : endDate || undefined}
          onSelect={handleSelect}
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
  );
};

export default DateRangePicker;

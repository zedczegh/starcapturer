
import { useState, useEffect } from 'react';
import { isSameDay, isAfter, isBefore, eachDayOfInterval } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function useDateSelection(isEditing: boolean, initialDate: Date) {
  const { t } = useLanguage();
  const [selectedDates, setSelectedDates] = useState<Date[]>(isEditing ? [initialDate] : [new Date()]);

  // Effect to ensure at least one date is selected
  useEffect(() => {
    if (selectedDates.length === 0) {
      setSelectedDates([new Date()]);
    }
  }, [selectedDates]);

  const handleCalendarSelect = (dates: Date[] | undefined) => {
    if (!dates || dates.length === 0) {
      // Auto-select today's date if the user cleared all dates
      setSelectedDates([new Date()]);
      toast.info(t("Today's date was automatically selected", "已自动选择今天的日期"));
      return;
    }

    // Get the current date (beginning of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If the user selects a date that's not today, create a range from today to that date
    if (dates.length === 1 && !isSameDay(dates[0], today)) {
      // Determine if the selected date is after today (which it should be, but checking anyway)
      if (isAfter(dates[0], today)) {
        // Create an array of all dates in the range from today to the selected date
        const dateRange = eachDayOfInterval({ start: today, end: dates[0] });
        
        // Set all dates in the range as selected
        setSelectedDates(dateRange);
        toast.info(t("Date range created from today", "已从今天创建日期范围"));
      } else {
        // Just in case they somehow selected a date before today
        setSelectedDates([today]);
        toast.info(t("Today's date was automatically selected", "已自动选择今天的日期"));
      }
    } else {
      // For other cases (like when selecting today), just use the normal selection
      setSelectedDates(dates);
    }
  };

  const removeDateBadge = (dateToRemove: Date) => {
    const newDates = selectedDates.filter(date => 
      !isSameDay(date, dateToRemove)
    );
    
    if (newDates.length === 0) {
      // Auto-select today's date if the user removes the last date
      setSelectedDates([new Date()]);
      toast.info(t("Today's date was automatically selected", "已自动选择今天的日期"));
    } else {
      setSelectedDates(newDates);
    }
  };

  return {
    selectedDates,
    setSelectedDates,
    handleCalendarSelect,
    removeDateBadge
  };
}

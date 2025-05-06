
import { useState, useEffect } from 'react';
import { isSameDay, isAfter, isBefore, eachDayOfInterval, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function useDateSelection(isEditing: boolean, initialDate: Date) {
  const { t } = useLanguage();
  const [selectedDates, setSelectedDates] = useState<Date[]>(isEditing ? [initialDate] : [new Date()]);
  const [rangeSelectionMode, setRangeSelectionMode] = useState(false);
  const [firstSelectedDate, setFirstSelectedDate] = useState<Date | null>(null);

  // Effect to ensure at least one date is selected
  useEffect(() => {
    if (selectedDates.length === 0) {
      setSelectedDates([new Date()]);
    }
  }, [selectedDates]);

  const handleCalendarSelect = (dates: Date[] | undefined) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Handle empty selection
    if (!dates || dates.length === 0) {
      setSelectedDates([today]);
      toast.info(t("Today's date was automatically selected", "已自动选择今天的日期"));
      return;
    }

    // Get the most recently selected date (the one that triggered this function)
    const latestSelection = dates[dates.length - 1];
    
    // If we're not in range selection mode and user selects a single date
    if (!rangeSelectionMode && dates.length === 1) {
      // Create range from today to selected date
      if (!isSameDay(latestSelection, today)) {
        // Ensure the range is ordered correctly (earlier date first)
        const start = isBefore(latestSelection, today) ? latestSelection : today;
        const end = isAfter(latestSelection, today) ? latestSelection : today;
        
        const dateRange = eachDayOfInterval({ start, end });
        setSelectedDates(dateRange);
        toast.info(t("Date range created", "已创建日期范围"));
      } else {
        // Just today was selected
        setSelectedDates(dates);
      }
    } else {
      // Normal selection (multiple dates or range selection is off)
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

  // Select all dates in current month
  const selectAll = (currentMonth: Date = new Date()) => {
    const firstDay = startOfMonth(currentMonth);
    const lastDay = endOfMonth(currentMonth);
    
    // Create an array of all days in the month
    const allDates: Date[] = [];
    const daysInMonth = getDaysInMonth(currentMonth);
    
    for (let i = 0; i < daysInMonth; i++) {
      const date = new Date(currentMonth);
      date.setDate(i + 1);
      // Only include future dates and today
      if (!isBefore(date, new Date())) {
        allDates.push(date);
      }
    }
    
    if (allDates.length > 0) {
      setSelectedDates(allDates);
      toast.info(t("Selected all available dates in the month", "已选择本月所有可用日期"));
    } else {
      toast.info(t("No available dates in this month", "本月没有可用日期"));
    }
  };

  // Delete all selected dates
  const deleteAll = () => {
    const today = new Date();
    setSelectedDates([today]);
    toast.info(t("All dates cleared. Today's date was automatically selected", "已清除所有日期。已自动选择今天的日期"));
  };

  return {
    selectedDates,
    setSelectedDates,
    handleCalendarSelect,
    removeDateBadge,
    selectAll,
    deleteAll
  };
}

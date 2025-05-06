
import { useState, useCallback } from 'react';
import { isSameDay, addDays, isAfter, isBefore } from 'date-fns';
import { toast } from 'sonner';

export function useDateSelection(isEditing: boolean, initialDate?: Date) {
  const [selectedDates, setSelectedDates] = useState<Date[]>(
    initialDate ? [initialDate] : []
  );

  // Handle single date or range selection based on editing mode
  const handleCalendarSelect = useCallback((dates: Date[] | undefined) => {
    if (!dates) {
      setSelectedDates([]);
      return;
    }

    if (isEditing) {
      // In editing mode, only allow selecting a single date
      setSelectedDates(dates.length > 0 ? [dates[dates.length - 1]] : []);
    } else {
      // In creation mode, handle range selection
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dates.length === 0) {
        setSelectedDates([]);
        return;
      }

      // If only one date selected, use it directly
      if (dates.length === 1) {
        setSelectedDates(dates);
        return;
      }

      // Find the most recently selected date (the last one in the array)
      const lastSelectedDate = dates[dates.length - 1];
      
      // Check if this is a new date not in our previous selection
      const isNewSelection = !selectedDates.some(d => isSameDay(d, lastSelectedDate));
      
      if (isNewSelection) {
        // If it's a new date, create a range from today to this date
        let newDates: Date[] = [];
        
        // Start from today
        let currentDate = new Date(today);
        
        // Add all dates from today until the selected date (inclusive)
        while (!isAfter(currentDate, lastSelectedDate)) {
          newDates.push(new Date(currentDate));
          currentDate = addDays(currentDate, 1);
        }
        
        setSelectedDates(newDates);
        toast.info(`Selected ${newDates.length} dates from today to ${lastSelectedDate.toLocaleDateString()}`);
      } else {
        // If it's a date we already had selected, remove it and all dates after it
        const newDates = selectedDates.filter(d => 
          isBefore(d, lastSelectedDate) || isSameDay(d, lastSelectedDate)
        );
        setSelectedDates(newDates);
      }
    }
  }, [isEditing, selectedDates]);

  // Remove a specific date
  const removeDateBadge = useCallback((dateToRemove: Date) => {
    setSelectedDates(prev => 
      prev.filter(date => !isSameDay(date, dateToRemove))
    );
  }, []);

  // Select all dates in the current month view
  const selectAll = useCallback((currentMonth?: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const year = currentMonth?.getFullYear() || today.getFullYear();
    const month = currentMonth?.getMonth() || today.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from today or first day of month, whichever is later
    const startDate = isAfter(today, firstDay) ? today : firstDay;
    let currentDate = new Date(startDate);
    
    // Create array of all dates from start to end of month
    const dates: Date[] = [];
    while (!isAfter(currentDate, lastDay)) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    setSelectedDates(dates);
    toast.success(`Selected ${dates.length} dates in ${currentMonth?.toLocaleString('default', { month: 'long' }) || 'current month'}`);
  }, []);

  // Delete all selected dates
  const deleteAll = useCallback(() => {
    setSelectedDates([]);
    toast.info("Cleared all selected dates");
  }, []);

  return {
    selectedDates,
    handleCalendarSelect,
    removeDateBadge,
    selectAll,
    deleteAll
  };
}

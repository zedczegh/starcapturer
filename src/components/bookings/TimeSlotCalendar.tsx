
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { isSameDay } from 'date-fns';

interface TimeSlotCalendarProps {
  selectedDates: Date[];
  onDateSelect: (date: Date | undefined) => void;
  startDate: Date | null;
  endDate: Date | null;
  selectionMode: 'start' | 'end';
  isRangeStartOrEnd: (date: Date) => boolean;
  isInSelectionRange: (date: Date) => boolean;
}

const TimeSlotCalendar: React.FC<TimeSlotCalendarProps> = ({
  selectedDates,
  onDateSelect,
  startDate,
  selectionMode,
  isRangeStartOrEnd,
  isInSelectionRange
}) => {
  return (
    <div className="bg-cosmic-900/40 rounded-lg border border-cosmic-700/40 p-2">
      <Calendar
        mode="single"
        selected={startDate}
        onSelect={onDateSelect}
        disabled={(date) => date < new Date()}
        className="bg-cosmic-800/30 rounded-lg"
        modifiersClassNames={{
          selected: "bg-primary text-primary-foreground",
          today: "bg-accent text-accent-foreground",
        }}
        modifiersStyles={{
          selected: { backgroundColor: selectionMode === 'end' ? "#3b82f6" : undefined },
          range_middle: { backgroundColor: "rgba(59, 130, 246, 0.3)", color: "white" },
        }}
        components={{
          Day: (props) => {
            const date = props.date;
            const isSelected = selectedDates.some(selectedDate => 
              isSameDay(selectedDate, date)
            );
            const isRangeEnd = isRangeStartOrEnd(date);
            const isInRange = isInSelectionRange(date);
            
            return (
              <div
                {...props}
                className={`
                  ${props.className || ''} 
                  ${isSelected ? 'bg-blue-600 text-white' : ''}
                  ${isRangeEnd ? 'rounded-full' : ''}
                  ${isInRange && !isRangeEnd ? 'bg-blue-500/30 text-white' : ''}
                `}
              />
            );
          }
        }}
      />
    </div>
  );
};

export default TimeSlotCalendar;

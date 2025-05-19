
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { DayContentProps } from 'react-day-picker';

interface TimeSlotCalendarProps {
  selectedDates: Date[];
  onDateSelect: (dates: Date[] | undefined) => void;
  disablePastDates?: boolean;
}

const TimeSlotCalendar: React.FC<TimeSlotCalendarProps> = ({
  selectedDates,
  onDateSelect,
  disablePastDates = true
}) => {
  const { t } = useLanguage();

  const handleClearSelection = () => {
    onDateSelect([]);
  };
  
  return (
    <div className="relative">
      <Calendar
        mode="multiple"
        selected={selectedDates}
        onSelect={onDateSelect}
        disabled={disablePastDates ? (date) => date < new Date() : undefined}
        className="bg-cosmic-800/30 rounded-lg"
        components={{
          Day: ({ date, ...props }: DayContentProps) => {
            // Check if the current day is between the first and last selected dates
            if (selectedDates.length >= 2) {
              const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
              const firstDate = sortedDates[0];
              const lastDate = sortedDates[sortedDates.length - 1];
              
              const isInRange = date && 
                date.getTime() > firstDate.getTime() &&
                date.getTime() < lastDate.getTime();
                
              if (isInRange) {
                return (
                  <div className={`${props.className} day-range-middle`}>
                    {props.children}
                  </div>
                );
              }
            }
            
            return <div className={props.className}>{props.children}</div>;
          }
        }}
      />
      
      {selectedDates.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 bg-cosmic-900/70 hover:bg-cosmic-900/90 text-gray-300"
          onClick={handleClearSelection}
        >
          <X className="w-4 h-4 mr-1" />
          {t("Clear", "清除")}
        </Button>
      )}
    </div>
  );
};

export default TimeSlotCalendar;

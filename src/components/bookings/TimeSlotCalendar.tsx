
import React, { useState } from 'react';
import { DayPicker, DayPickerSingleProps } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type TimeSlotCalendarProps = {
  selectedDates: Date[];
  onSelect: (dates: Date[]) => void;
  className?: string;
}

export default function TimeSlotCalendar({
  selectedDates,
  onSelect,
  className
}: TimeSlotCalendarProps) {
  const [month, setMonth] = useState<Date>(new Date());
  
  // Custom navigation components
  const CustomNavigation = ({ 
    month,
    onPreviousClick,
    onNextClick,
  }: {
    month: Date;
    onPreviousClick: () => void;
    onNextClick: () => void;
  }) => {
    return (
      <div className="flex justify-between items-center px-1 pb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPreviousClick}
          className="text-gray-300 hover:text-white hover:bg-cosmic-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="font-medium text-gray-100">
          {format(month, 'MMMM yyyy')}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNextClick}
          className="text-gray-300 hover:text-white hover:bg-cosmic-800"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    );
  };

  // Function to handle navigation
  const handleMonthChange = (newMonth: Date) => {
    setMonth(newMonth);
  };

  return (
    <Card className={cn(
      'bg-cosmic-800/60 border-cosmic-700/40 p-3', 
      className
    )}>
      <DayPicker
        mode="multiple"
        selected={selectedDates}
        onSelect={onSelect}
        disabled={(date) => date < new Date()}
        month={month}
        onMonthChange={handleMonthChange}
        classNames={{
          months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
          month: 'space-y-2',
          caption: 'hidden', // Hide default caption since we're using custom navigation
          caption_label: 'hidden',
          nav: 'hidden', // Hide default navigation
          table: 'w-full border-collapse space-y-1',
          head_row: 'flex',
          head_cell: 'text-gray-300 rounded-md w-9 font-normal text-[0.8rem] p-0 m-0 text-center',
          row: 'flex w-full mt-2',
          cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-cosmic-700/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
          day: cn(
            'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
            'hover:bg-cosmic-700/70 hover:text-white focus:bg-cosmic-700 focus:text-white',
            'text-gray-200'
          ),
          day_selected: 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white',
          day_today: 'bg-cosmic-700 text-cyan-200 border border-cyan-300/50',
          day_disabled: 'text-gray-500 opacity-50 hover:bg-transparent',
          day_hidden: 'invisible',
        }}
        components={{
          Caption: ({ displayMonth, ...props }) => (
            <CustomNavigation 
              month={displayMonth} 
              onPreviousClick={() => {
                const prevMonth = new Date(displayMonth);
                prevMonth.setMonth(prevMonth.getMonth() - 1);
                handleMonthChange(prevMonth);
              }}
              onNextClick={() => {
                const nextMonth = new Date(displayMonth);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                handleMonthChange(nextMonth);
              }}
            />
          )
        }}
      />
    </Card>
  );
}

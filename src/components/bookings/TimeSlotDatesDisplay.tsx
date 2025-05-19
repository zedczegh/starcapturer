
import React from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface TimeSlotDatesDisplayProps {
  selectedDates: Date[];
}

const TimeSlotDatesDisplay: React.FC<TimeSlotDatesDisplayProps> = ({ selectedDates }) => {
  const { t } = useLanguage();

  return (
    <>
      <div className="text-xs text-gray-400 mt-1">
        {t("Selected dates", "已选择日期")}: {selectedDates.length}
      </div>
      {selectedDates.length > 0 && (
        <div className="text-xs text-gray-300 mt-1">
          {selectedDates.length > 3 
            ? `${format(selectedDates[0], 'yyyy-MM-dd')} - ${format(selectedDates[selectedDates.length-1], 'yyyy-MM-dd')}`
            : selectedDates.map(date => format(date, 'yyyy-MM-dd')).join(', ')}
        </div>
      )}
    </>
  );
};

export default TimeSlotDatesDisplay;

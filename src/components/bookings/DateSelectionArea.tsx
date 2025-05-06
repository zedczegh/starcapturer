
import React from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, X as CalendarX, Calendar as SelectAll } from 'lucide-react';

interface DateSelectionAreaProps {
  isEditing: boolean;
  selectedDates: Date[];
  handleCalendarSelect: (dates: Date[] | undefined) => void;
  removeDateBadge: (date: Date) => void;
  selectAll: (currentMonth?: Date) => void;
  deleteAll: () => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

const DateSelectionArea: React.FC<DateSelectionAreaProps> = ({
  isEditing,
  selectedDates,
  handleCalendarSelect,
  removeDateBadge,
  selectAll,
  deleteAll,
  currentMonth,
  setCurrentMonth,
}) => {
  const { t } = useLanguage();

  return (
    <div>
      <Label htmlFor="date" className="block text-sm text-gray-300 mb-1">
        {isEditing
          ? t("Date", "日期")
          : t("Select Dates", "选择日期")
        }
        <span className="text-xs ml-1 text-gray-400">
          {isEditing ? "" : t("(select a date to create a range from today)", "（选择一个日期创建从今天开始的范围）")}
        </span>
      </Label>

      {!isEditing && (
        <div className="flex flex-wrap gap-2 mb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => selectAll(currentMonth)}
            className="flex items-center gap-1 text-xs bg-cosmic-800/70"
          >
            <SelectAll className="h-3.5 w-3.5" />
            {t("Select All", "全选")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={deleteAll}
            className="flex items-center gap-1 text-xs bg-cosmic-800/70"
          >
            <CalendarX className="h-3.5 w-3.5" />
            {t("Clear All", "清除全部")}
          </Button>
        </div>
      )}

      <div className="bg-cosmic-900/40 rounded-lg border border-cosmic-700/40 p-2">
        {isEditing ? (
          <Calendar
            mode="single"
            selected={selectedDates[0]}
            onSelect={(date) => date && handleCalendarSelect([date])}
            disabled={(date) => date < new Date()}
            className="bg-cosmic-800/30 rounded-lg"
          />
        ) : (
          <Calendar
            mode="multiple"
            selected={selectedDates}
            onSelect={handleCalendarSelect}
            disabled={(date) => date < new Date()}
            className="bg-cosmic-800/30 rounded-lg"
            onMonthChange={setCurrentMonth}
          />
        )}
      </div>
      
      {!isEditing && selectedDates.length > 0 && (
        <div className="mt-2">
          <Label className="block text-sm text-gray-300 mb-1">
            {t("Selected Dates", "已选择日期")} ({selectedDates.length})
          </Label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
            {selectedDates.map((date, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="pl-2 pr-1 py-1 flex items-center gap-1 bg-cosmic-800/60"
              >
                {format(date, 'MMM dd, yyyy')}
                <Button 
                  type="button"
                  size="icon" 
                  variant="ghost" 
                  className="h-5 w-5 ml-1 rounded-full hover:bg-cosmic-700/50"
                  onClick={() => removeDateBadge(date)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateSelectionArea;

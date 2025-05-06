
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TimeCapacityInputsProps {
  startTime: string;
  setStartTime: (value: string) => void;
  endTime: string;
  setEndTime: (value: string) => void;
  maxCapacity: number;
  setMaxCapacity: (value: number) => void;
}

const TimeCapacityInputs: React.FC<TimeCapacityInputsProps> = ({
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  maxCapacity,
  setMaxCapacity
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="start-time" className="block text-sm text-gray-300 mb-1">
          {t("Start Time", "开始时间")}
        </Label>
        <Input
          id="start-time"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="end-time" className="block text-sm text-gray-300 mb-1">
          {t("End Time", "结束时间")}
        </Label>
        <Input
          id="end-time"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200"
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          {t("For overnight sessions, set end time earlier than start time", "对于通宵会话，请将结束时间设置为早于开始时间")}
        </p>
      </div>
      
      <div>
        <Label htmlFor="capacity" className="block text-sm text-gray-300 mb-1">
          {t("Maximum Capacity", "最大容量")}
        </Label>
        <Input
          id="capacity"
          type="number"
          min="1"
          max="100"
          value={maxCapacity}
          onChange={(e) => setMaxCapacity(parseInt(e.target.value))}
          className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200"
          required
        />
      </div>
    </div>
  );
};

export default TimeCapacityInputs;


import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimeSlotDetailsFormProps {
  startTime: string;
  endTime: string;
  maxCapacity: number;
  petsPolicy: string;
  price: number;
  currency: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onMaxCapacityChange: (value: number) => void;
  onPetsPolicyChange: (value: string) => void;
  onPriceChange: (value: number) => void;
  onCurrencyChange: (value: string) => void;
}

const CURRENCY_OPTIONS = [
  { value: '$', label: 'USD ($)' },
  { value: '€', label: 'EUR (€)' },
  { value: '¥', label: 'CNY (¥)' },
  { value: '£', label: 'GBP (£)' },
  { value: '₹', label: 'INR (₹)' },
  { value: '₩', label: 'KRW (₩)' },
  { value: '¥', label: 'JPY (¥)' },
];

const TimeSlotDetailsForm: React.FC<TimeSlotDetailsFormProps> = ({
  startTime,
  endTime,
  maxCapacity,
  petsPolicy,
  price,
  currency,
  onStartTimeChange,
  onEndTimeChange,
  onMaxCapacityChange,
  onPetsPolicyChange,
  onPriceChange,
  onCurrencyChange
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
          onChange={(e) => onStartTimeChange(e.target.value)}
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
          onChange={(e) => onEndTimeChange(e.target.value)}
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
          onChange={(e) => onMaxCapacityChange(parseInt(e.target.value))}
          className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200"
          required
        />
      </div>

      <div>
        <Label htmlFor="pets-policy" className="block text-sm text-gray-300 mb-1">
          {t("Pets Policy", "宠物政策")}
        </Label>
        <Select 
          value={petsPolicy} 
          onValueChange={onPetsPolicyChange}
        >
          <SelectTrigger className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200">
            <SelectValue placeholder={t("Select pets policy", "选择宠物政策")} />
          </SelectTrigger>
          <SelectContent className="bg-cosmic-800 border-cosmic-700">
            <SelectItem value="not_allowed">{t("Not Allowed", "不允许")}</SelectItem>
            <SelectItem value="allowed">{t("Allowed", "允许")}</SelectItem>
            <SelectItem value="only_small">{t("Only Small Pets", "仅小型宠物")}</SelectItem>
            <SelectItem value="approval_required">{t("Host Approval Required", "需要主人批准")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="price" className="block text-sm text-gray-300 mb-1">
            {t("Price", "价格")}
          </Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => onPriceChange(parseFloat(e.target.value))}
            className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200"
            placeholder="0.00"
          />
        </div>

        <div className="w-1/3">
          <Label htmlFor="currency" className="block text-sm text-gray-300 mb-1">
            {t("Currency", "货币")}
          </Label>
          <Select 
            value={currency} 
            onValueChange={onCurrencyChange}
          >
            <SelectTrigger className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200">
              <SelectValue placeholder="$" />
            </SelectTrigger>
            <SelectContent className="bg-cosmic-800 border-cosmic-700">
              {CURRENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotDetailsForm;

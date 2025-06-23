
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { SUPPORTED_CURRENCIES, getCurrencySymbol, formatCurrency } from '@/utils/currencyUtils';

interface PricingInputProps {
  price: number;
  currency: string;
  isFree: boolean;
  onPriceChange: (price: number) => void;
  onCurrencyChange: (currency: string) => void;
  onFreeToggle: (isFree: boolean) => void;
}

const PricingInput: React.FC<PricingInputProps> = ({
  price,
  currency,
  isFree,
  onPriceChange,
  onCurrencyChange,
  onFreeToggle
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="free-toggle"
          checked={isFree}
          onCheckedChange={onFreeToggle}
        />
        <Label htmlFor="free-toggle" className="text-sm text-gray-300">
          {t('Free booking', '免费预订')}
        </Label>
      </div>

      {!isFree && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price" className="block text-sm text-gray-300 mb-1">
              {t('Price per night', '每晚价格')}
            </Label>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
                className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="currency" className="block text-sm text-gray-300 mb-1">
              {t('Currency', '货币')}
            </Label>
            <Select value={currency} onValueChange={onCurrencyChange}>
              <SelectTrigger className="bg-cosmic-900/40 border-cosmic-700/40 text-gray-200">
                <SelectValue placeholder={t('Select currency', '选择货币')} />
              </SelectTrigger>
              <SelectContent className="bg-cosmic-800 border-cosmic-700">
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <SelectItem key={curr} value={curr}>
                    {getCurrencySymbol(curr)} {curr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {isFree && (
        <div className="text-sm text-gray-400 bg-cosmic-800/30 p-3 rounded-lg">
          {t('This time slot is free. Guests can book without payment.', 
             '此时段免费。客人可以免费预订。')}
        </div>
      )}
    </div>
  );
};

export default PricingInput;

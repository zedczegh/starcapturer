
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { convertCurrency, formatCurrency, getUserPreferredCurrency } from '@/utils/currencyUtils';

interface PriceCalculatorProps {
  pricePerNight: number;
  currency: string;
  numberOfNights: number;
  isFree: boolean;
  className?: string;
}

const PriceCalculator: React.FC<PriceCalculatorProps> = ({
  pricePerNight,
  currency,
  numberOfNights,
  isFree,
  className = ''
}) => {
  const { t } = useLanguage();
  const userCurrency = getUserPreferredCurrency();
  
  if (isFree) {
    return (
      <div className={`bg-green-600/20 border border-green-600/30 rounded-lg p-4 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-green-400 mb-2">
            {t('Free Booking', '免费预订')}
          </h3>
          <p className="text-sm text-green-300">
            {t('This reservation is completely free!', '此预订完全免费！')}
          </p>
        </div>
      </div>
    );
  }

  const totalPrice = pricePerNight * numberOfNights;
  const convertedPrice = currency === userCurrency 
    ? totalPrice 
    : convertCurrency(totalPrice, currency, userCurrency);
  
  const displayCurrency = currency === userCurrency ? currency : userCurrency;

  return (
    <div className={`bg-cosmic-800/60 border border-cosmic-700/40 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-200 mb-3">
        {t('Price Breakdown', '价格明细')}
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-300">
          <span>
            {formatCurrency(pricePerNight, currency)} × {numberOfNights} {numberOfNights === 1 ? t('night', '晚') : t('nights', '晚')}
          </span>
          <span>{formatCurrency(totalPrice, currency)}</span>
        </div>
        
        {currency !== userCurrency && (
          <div className="flex justify-between text-gray-400 text-xs">
            <span>{t('In your currency', '按您的货币')}</span>
            <span>{formatCurrency(convertedPrice, displayCurrency)}</span>
          </div>
        )}
        
        <hr className="border-cosmic-600/30" />
        
        <div className="flex justify-between font-semibold text-gray-100">
          <span>{t('Total', '总计')}</span>
          <span>{formatCurrency(convertedPrice, displayCurrency)}</span>
        </div>
      </div>
    </div>
  );
};

export default PriceCalculator;

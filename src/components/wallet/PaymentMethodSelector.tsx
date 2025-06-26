
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard } from 'lucide-react';

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const { t } = useLanguage();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`bg-cosmic-900/40 border-cosmic-700/40 text-gray-200 ${className}`}>
        <SelectValue placeholder={t('Select payment method', '选择支付方式')} />
      </SelectTrigger>
      <SelectContent className="bg-cosmic-800 border-cosmic-700">
        <SelectItem value="card">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {t('Credit/Debit Card', '信用卡/借记卡')}
          </div>
        </SelectItem>
        <SelectItem value="paypal">
          <div className="flex items-center gap-2">
            <span className="text-blue-500 font-semibold">P</span>
            PayPal
          </div>
        </SelectItem>
        <SelectItem value="wechat">
          <div className="flex items-center gap-2">
            <span className="text-green-500 font-semibold">微</span>
            {t('WeChat Pay', '微信支付')}
          </div>
        </SelectItem>
        <SelectItem value="alipay">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-semibold">支</span>
            {t('Alipay', '支付宝')}
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default PaymentMethodSelector;

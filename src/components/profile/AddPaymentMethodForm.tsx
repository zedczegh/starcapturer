import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';

interface AddPaymentMethodFormProps {
  onSuccess: () => void;
}

const AddPaymentMethodForm: React.FC<AddPaymentMethodFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    brand: 'visa'
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19); // Max length for formatted card number
  };

  const detectCardBrand = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.startsWith('4')) return 'visa';
    if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'mastercard';
    if (cleaned.startsWith('3')) return 'amex';
    return 'visa';
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    const brand = detectCardBrand(value);
    setFormData(prev => ({ 
      ...prev, 
      cardNumber: formatted,
      brand 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const cleanCardNumber = formData.cardNumber.replace(/\D/g, '');
      
      // Basic validation
      if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
        throw new Error(t('Invalid card number', '无效的卡号'));
      }

      if (!formData.expiryMonth || !formData.expiryYear) {
        throw new Error(t('Please select expiry date', '请选择过期日期'));
      }

      if (formData.cvv.length < 3 || formData.cvv.length > 4) {
        throw new Error(t('Invalid CVV', '无效的CVV'));
      }

      // In a real implementation, you would integrate with Stripe or another payment processor
      // For now, we'll just store the card info (last 4 digits only for security)
      const { error } = await supabase
        .from('user_payment_methods')
        .insert({
          user_id: user.id,
          payment_type: 'card',
          brand: formData.brand,
          last_four: cleanCardNumber.slice(-4),
          exp_month: parseInt(formData.expiryMonth),
          exp_year: parseInt(formData.expiryYear),
          is_default: false
        });

      if (error) throw error;

      toast.success(t('Payment method added successfully', '支付方式添加成功'));
      onSuccess();
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      toast.error(t('Failed to add payment method', '添加支付方式失败'), {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="cardNumber" className="text-white mb-2 block">
            {t('Card Number', '卡号')}
          </Label>
          <div className="relative">
            <Input
              id="cardNumber"
              type="text"
              value={formData.cardNumber}
              onChange={(e) => handleCardNumberChange(e.target.value)}
              placeholder="1234 5678 9012 3456"
              className="pl-10 bg-cosmic-800/50 border-cosmic-700/40 text-white"
              required
            />
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cosmic-400" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="expiryMonth" className="text-white mb-2 block">
              {t('Month', '月')}
            </Label>
            <Select value={formData.expiryMonth} onValueChange={(value) => handleInputChange('expiryMonth', value)}>
              <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700/40 text-white">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent className="bg-cosmic-800 border-cosmic-700/40">
                {months.map(month => (
                  <SelectItem key={month} value={month} className="text-white">
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="expiryYear" className="text-white mb-2 block">
              {t('Year', '年')}
            </Label>
            <Select value={formData.expiryYear} onValueChange={(value) => handleInputChange('expiryYear', value)}>
              <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700/40 text-white">
                <SelectValue placeholder="YYYY" />
              </SelectTrigger>
              <SelectContent className="bg-cosmic-800 border-cosmic-700/40">
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()} className="text-white">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="cvv" className="text-white mb-2 block">
              {t('CVV', 'CVV')}
            </Label>
            <Input
              id="cvv"
              type="text"
              value={formData.cvv}
              onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, '').substring(0, 4))}
              placeholder="123"
              className="bg-cosmic-800/50 border-cosmic-700/40 text-white"
              required
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-cosmic-700/30">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-[#8A6FD6] hover:opacity-90 text-white"
        >
          {loading ? t('Adding...', '添加中...') : t('Add Payment Method', '添加支付方式')}
        </Button>
      </div>
    </form>
  );
};

export default AddPaymentMethodForm;
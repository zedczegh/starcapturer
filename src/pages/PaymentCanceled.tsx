
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

const PaymentCanceled = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-cosmic-900 flex items-center justify-center">
      <Card className="bg-cosmic-800/60 border-cosmic-700/40 p-8 text-center max-w-md">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-100 mb-2">
          {t('Payment Canceled', '支付已取消')}
        </h1>
        <p className="text-gray-400 mb-6">
          {t('Your payment was canceled. You can try again anytime.', '您的支付已取消。您可以随时重试。')}
        </p>
        
        <div className="space-y-2">
          <Button
            onClick={() => navigate('/community')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {t('Browse Astro Spots', '浏览观星点')}
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="w-full text-gray-400 hover:text-gray-200"
          >
            {t('Back to Home', '返回首页')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PaymentCanceled;


import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        toast.error(t('Invalid payment session', '无效的支付会话'));
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId }
        });

        if (error) throw error;

        setVerificationResult(data);
        if (data.status === 'paid') {
          toast.success(t('Payment successful!', '支付成功！'));
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        toast.error(t('Payment verification failed', '支付验证失败'));
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, navigate, t]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-cosmic-900 flex items-center justify-center">
        <Card className="bg-cosmic-800/60 border-cosmic-700/40 p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-100 mb-2">
            {t('Verifying Payment', '验证支付中')}
          </h2>
          <p className="text-gray-400">
            {t('Please wait while we confirm your payment...', '请稍候，我们正在确认您的支付...')}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cosmic-900 flex items-center justify-center">
      <Card className="bg-cosmic-800/60 border-cosmic-700/40 p-8 text-center max-w-md">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-100 mb-2">
          {t('Payment Successful!', '支付成功！')}
        </h1>
        <p className="text-gray-400 mb-6">
          {t('Your payment has been processed successfully.', '您的支付已成功处理。')}
        </p>
        
        <div className="space-y-2 mb-6">
          <Button
            onClick={() => navigate('/my-reservations')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {t('View My Reservations', '查看我的预订')}
          </Button>
          <Button
            onClick={() => navigate('/wallet')}
            variant="outline"
            className="w-full bg-cosmic-700/50 border-cosmic-600/50 hover:bg-cosmic-600/50"
          >
            {t('View Wallet', '查看钱包')}
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

export default PaymentSuccess;

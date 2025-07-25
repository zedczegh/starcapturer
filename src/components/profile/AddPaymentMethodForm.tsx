import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NODE_ENV === 'production' 
  ? 'pk_live_...' // Replace with your live publishable key
  : 'pk_test_51QT8jGF3lHO8e0QgxQJGGv8FfQjcKtj6sFjg6V4s5X6YAmX9t7R5x9t8mN7P4S3w2F1' // Replace with your test key
);

interface AddPaymentMethodFormProps {
  onSuccess: () => void;
}

const PaymentMethodForm: React.FC<AddPaymentMethodFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !user) return;

    setLoading(true);
    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      // Create setup intent
      const { data: setupData, error: setupError } = await supabase.functions.invoke('create-setup-intent');
      
      if (setupError) throw setupError;
      if (!setupData?.client_secret) throw new Error('Failed to create setup intent');

      console.log('Setup intent created, confirming...');

      // Confirm setup intent with card
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        setupData.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: user.email,
            },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (setupIntent && setupIntent.payment_method) {
        console.log('Payment method confirmed, saving...');
        
        // Save payment method to database
        const { error: saveError } = await supabase.functions.invoke('save-payment-method', {
          body: {
            payment_method_id: setupIntent.payment_method,
            is_default: false
          }
        });

        if (saveError) throw saveError;

        toast.success(t('Payment method added successfully', '支付方式添加成功'));
        onSuccess();
      }

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
        <div className="p-4 bg-cosmic-800/30 rounded-lg border border-cosmic-700/30">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': {
                    color: '#64748b',
                  },
                  backgroundColor: 'transparent',
                },
                invalid: {
                  color: '#ef4444',
                },
              },
              hidePostalCode: false,
            }}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-cosmic-700/30">
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-gradient-to-r from-primary to-[#8A6FD6] hover:opacity-90 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('Adding...', '添加中...')}
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              {t('Add Payment Method', '添加支付方式')}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

const AddPaymentMethodForm: React.FC<AddPaymentMethodFormProps> = ({ onSuccess }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodForm onSuccess={onSuccess} />
    </Elements>
  );
};

export default AddPaymentMethodForm;
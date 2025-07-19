import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, Loader2 } from 'lucide-react';

interface PaymentButtonProps {
  timeslotId: string;
  amount: number;
  currency?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function PaymentButton({ 
  timeslotId, 
  amount, 
  currency = "usd", 
  disabled = false,
  className = "",
  children 
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          timeslotId,
          amount,
          currency
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Payment Error", {
        description: error.message || "Failed to create payment session",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <CreditCard className="h-4 w-4 mr-2" />
      )}
      {children || `Pay ${currency.toUpperCase()} ${amount}`}
    </Button>
  );
}
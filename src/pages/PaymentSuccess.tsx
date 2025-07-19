import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  const sessionId = searchParams.get('session_id');
  const timeslotId = searchParams.get('timeslot_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setVerificationStatus('error');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId }
        });

        if (error) {
          throw error;
        }

        if (data?.paymentStatus === 'paid') {
          setVerificationStatus('success');
          toast.success("Payment Successful!", {
            description: "Your booking has been confirmed.",
          });
        } else {
          setVerificationStatus('error');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setVerificationStatus('error');
        toast.error("Verification Error", {
          description: "There was an issue verifying your payment.",
        });
      }
    };

    verifyPayment();
  }, [sessionId]);

  const handleGoToBookings = () => {
    navigate('/bookings');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-xl font-semibold">Verifying Payment</h2>
              <p className="text-muted-foreground text-center">
                Please wait while we confirm your payment...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Payment Issue</CardTitle>
            <CardDescription>
              There was an issue with your payment. Please contact support if you believe this is an error.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGoHome} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle>Payment Successful!</CardTitle>
          <CardDescription>
            Your astro spot booking has been confirmed. You will receive a confirmation email shortly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p><strong>Session ID:</strong> {sessionId}</p>
            {timeslotId && <p><strong>Timeslot ID:</strong> {timeslotId}</p>}
          </div>
          <div className="space-y-2">
            <Button onClick={handleGoToBookings} className="w-full">
              View My Bookings
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="w-full">
              Return Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
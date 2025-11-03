import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

interface VerificationPendingBadgeProps {
  spotId: string;
  verificationStatus?: string;
  className?: string;
}

export function VerificationPendingBadge({ spotId, verificationStatus, className = '' }: VerificationPendingBadgeProps) {
  const { isAdmin } = useUserRole();
  const [hasPendingApplication, setHasPendingApplication] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPendingApplication = async () => {
      if (!isAdmin || !spotId) {
        setLoading(false);
        return;
      }

      try {
        // First check if the spot itself has pending verification status
        if (verificationStatus === 'pending') {
          setHasPendingApplication(true);
          setLoading(false);
          return;
        }

        // Otherwise check for pending applications
        const { data, error } = await supabase
          .from('astro_spot_verification_applications')
          .select('id')
          .eq('spot_id', spotId)
          .eq('status', 'pending')
          .maybeSingle();

        setHasPendingApplication(!!data && !error);
      } catch (error) {
        console.error('Error checking pending application:', error);
      } finally {
        setLoading(false);
      }
    };

    checkPendingApplication();
  }, [spotId, isAdmin, verificationStatus]);

  if (!isAdmin || loading || !hasPendingApplication) return null;

  return (
    <Badge 
      variant="secondary" 
      className={`
        bg-orange-100 text-orange-800 border-orange-300 
        dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700
        flex items-center gap-1 font-medium text-xs
        ${className}
      `}
    >
      <Clock className="h-3 w-3" />
      Verification Pending
    </Badge>
  );
}
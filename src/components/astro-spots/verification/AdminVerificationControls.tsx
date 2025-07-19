import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Shield } from 'lucide-react';

interface AdminVerificationControlsProps {
  spotId: string;
  currentStatus: string;
  onStatusUpdate: () => void;
}

export function AdminVerificationControls({ 
  spotId, 
  currentStatus, 
  onStatusUpdate 
}: AdminVerificationControlsProps) {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [updating, setUpdating] = useState(false);
  const [hasApplications, setHasApplications] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if there are any verification applications for this spot
  useEffect(() => {
    const checkApplications = async () => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('astro_spot_verification_applications')
          .select('id')
          .eq('spot_id', spotId)
          .limit(1);

        if (error) throw error;
        
        setHasApplications(data && data.length > 0);
      } catch (error) {
        console.error('Error checking verification applications:', error);
        setHasApplications(false);
      } finally {
        setLoading(false);
      }
    };

    checkApplications();
  }, [spotId, isAdmin]);

  // Only show controls if user is admin AND there are applications OR the spot already has a status other than unverified
  if (!isAdmin || loading) return null;
  
  // Show controls if there are applications OR if the spot has been processed before (not unverified)
  if (!hasApplications && currentStatus === 'unverified') return null;

  const handleVerify = async () => {
    if (!user) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('user_astro_spots')
        .update({ verification_status: 'verified' })
        .eq('id', spotId);

      if (error) throw error;

      toast.success('Astro spot verified successfully!');
      onStatusUpdate();
    } catch (error) {
      console.error('Error verifying astro spot:', error);
      toast.error('Failed to verify astro spot');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!user) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('user_astro_spots')
        .update({ verification_status: 'rejected' })
        .eq('id', spotId);

      if (error) throw error;

      toast.success('Astro spot status updated');
      onStatusUpdate();
    } catch (error) {
      console.error('Error updating astro spot status:', error);
      toast.error('Failed to update astro spot status');
    } finally {
      setUpdating(false);
    }
  };

  const handleReset = async () => {
    if (!user) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('user_astro_spots')
        .update({ verification_status: 'unverified' })
        .eq('id', spotId);

      if (error) throw error;

      toast.success('Astro spot status reset');
      onStatusUpdate();
    } catch (error) {
      console.error('Error resetting astro spot status:', error);
      toast.error('Failed to reset astro spot status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <Shield className="h-5 w-5" />
          Administrator Controls
        </CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          As an administrator, you can directly change the verification status of this astro spot.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Current Status:</span>
          <Badge variant={currentStatus === 'verified' ? 'default' : 'secondary'}>
            {currentStatus}
          </Badge>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {currentStatus !== 'verified' && (
            <Button
              onClick={handleVerify}
              disabled={updating}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify Now
            </Button>
          )}
          
          {currentStatus !== 'rejected' && (
            <Button
              onClick={handleReject}
              disabled={updating}
              variant="destructive"
              size="sm"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          )}
          
          {currentStatus !== 'unverified' && (
            <Button
              onClick={handleReset}
              disabled={updating}
              variant="outline"
              size="sm"
            >
              Reset Status
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, CheckCircle, XCircle } from 'lucide-react';
import ApplicationMaterials from './ApplicationMaterials';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface VerificationApplication {
  id: string;
  spot_id: string;
  applicant_id: string;
  status: string;
  bortle_level?: number;
  created_at: string;
  bortle_measurement_url?: string;
  facility_images_urls?: string[];
  accommodation_description?: string;
  additional_notes?: string;
  admin_notes?: string;
  user_astro_spots: {
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
  };
  profiles: {
    username?: string;
    avatar_url?: string;
  };
}

interface VerificationApplicationCardProps {
  application: VerificationApplication;
  onStatusUpdate: () => void;
}

const VerificationApplicationCard: React.FC<VerificationApplicationCardProps> = ({
  application,
  onStatusUpdate
}) => {
  const { t } = useLanguage();
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState(application.admin_notes || '');

  const handleApplicationDecision = async (approved: boolean) => {
    setUpdating(true);
    try {
      const newStatus = approved ? 'approved' : 'rejected';
      
      // Update application status
      const { error: appError } = await supabase
        .from('astro_spot_verification_applications')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', application.id);

      if (appError) throw appError;

      // Update spot verification status
      const spotStatus = approved ? 'verified' : 'rejected';
      const { error: spotError } = await supabase
        .from('user_astro_spots')
        .update({ verification_status: spotStatus })
        .eq('id', application.spot_id);

      if (spotError) throw spotError;

      // Send verification message
      await sendVerificationMessage(application.applicant_id, approved, application.user_astro_spots.name);

      toast.success(
        approved 
          ? t('Application approved successfully', '申请已成功批准')
          : t('Application rejected successfully', '申请已成功拒绝')
      );
      
      onStatusUpdate();
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error(t('Failed to update application', '更新申请失败'));
    } finally {
      setUpdating(false);
    }
  };

  const sendVerificationMessage = async (applicantId: string, isApproved: boolean, spotName: string) => {
    const message = isApproved
      ? `Your verification application for "${spotName}" has been approved! Your astro spot is now verified.`
      : `Your verification application for "${spotName}" has been rejected. Please check the admin notes for more details.`;

    const { error } = await supabase
      .from('user_messages')
      .insert({
        sender_id: '00000000-0000-0000-0000-000000000000', // System message
        receiver_id: applicantId,
        message: message
      });

    if (error) {
      console.error('Error sending verification message:', error);
    }
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      // Open in new tab instead of forcing download
      if (url.startsWith('http')) {
        window.open(url, '_blank');
      } else {
        const { data } = supabase.storage
          .from('verification-materials')
          .getPublicUrl(url);
        window.open(data.publicUrl, '_blank');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      toast.error('Failed to open file');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
    }
  };

  return (
    <Card className="bg-cosmic-800/60 border-cosmic-700/40">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg text-cosmic-100 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {application.user_astro_spots.name}
            </CardTitle>
            <p className="text-sm text-cosmic-300 mt-1">
              Applicant: {application.profiles.username || 'Unknown User'}
            </p>
            <p className="text-xs text-cosmic-400">
              Applied {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
            </p>
          </div>
          {getStatusBadge(application.status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Location Details */}
        <div className="bg-cosmic-900/40 rounded-lg p-3">
          <p className="text-sm text-cosmic-200">
            <strong>Location:</strong> {application.user_astro_spots.latitude.toFixed(4)}, {application.user_astro_spots.longitude.toFixed(4)}
          </p>
          {application.bortle_level && (
            <p className="text-sm text-cosmic-200">
              <strong>Bortle Level:</strong> {application.bortle_level}
            </p>
          )}
          {application.user_astro_spots.description && (
            <p className="text-sm text-cosmic-200 mt-2">
              <strong>Description:</strong> {application.user_astro_spots.description}
            </p>
          )}
        </div>

        {/* Application Materials */}
        <ApplicationMaterials application={application} />

        {/* Text Content */}
        <div className="space-y-3">
          {application.accommodation_description && (
            <div className="bg-cosmic-900/40 rounded-lg p-3">
              <p className="text-sm text-cosmic-200">
                <strong>Accommodation Description:</strong>
              </p>
              <p className="text-sm text-cosmic-300 mt-1">{application.accommodation_description}</p>
            </div>
          )}

          {application.additional_notes && (
            <div className="bg-cosmic-900/40 rounded-lg p-3">
              <p className="text-sm text-cosmic-200">
                <strong>Additional Notes:</strong>
              </p>
              <p className="text-sm text-cosmic-300 mt-1">{application.additional_notes}</p>
            </div>
          )}
        </div>

        {/* Admin Controls */}
        {application.status === 'pending' && (
          <div className="space-y-3 pt-4 border-t border-cosmic-700/40">
            <div>
              <label className="text-sm text-cosmic-200 mb-2 block">Admin Notes:</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes for the applicant..."
                className="bg-cosmic-900/40 border-cosmic-700/40 text-cosmic-100"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => handleApplicationDecision(true)}
                disabled={updating}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                {updating ? 'Processing...' : 'Approve'}
              </Button>
              <Button
                onClick={() => handleApplicationDecision(false)}
                disabled={updating}
                variant="destructive"
                className="flex items-center gap-1"
              >
                <XCircle className="h-4 w-4" />
                {updating ? 'Processing...' : 'Reject'}
              </Button>
            </div>
          </div>
        )}

        {/* Show admin notes if available */}
        {application.admin_notes && application.status !== 'pending' && (
          <div className="bg-cosmic-900/40 rounded-lg p-3">
            <p className="text-sm text-cosmic-200">
              <strong>Admin Notes:</strong>
            </p>
            <p className="text-sm text-cosmic-300 mt-1">{application.admin_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VerificationApplicationCard;
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, ExternalLink, Eye } from 'lucide-react';

interface VerificationApplication {
  id: string;
  spot_id: string;
  applicant_id: string;
  status: string;
  bortle_level: number;
  bortle_measurement_url?: string;
  facility_images_urls: string[];
  accommodation_description?: string;
  additional_notes?: string;
  admin_notes?: string;
  created_at: string;
  user_astro_spots: {
    name: string;
    description: string;
    latitude: number;
    longitude: number;
  };
  applicant_username?: string;
}

const VerificationApplicationsManager: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isAdmin } = useUserRole();
  const [processingApplication, setProcessingApplication] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  const { data: applications, isLoading, refetch } = useQuery({
    queryKey: ['verification-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('astro_spot_verification_applications')
        .select(`
          *,
          user_astro_spots!inner(name, description, latitude, longitude)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch usernames for each application
      const applicationsWithUsernames = await Promise.all(
        (data || []).map(async (app) => {
          const { data: profile } = await supabase
            .rpc('get_public_profile', { p_user_id: app.applicant_id });
          
          const profileData = profile?.[0];
          return {
            ...app,
            applicant_username: profileData?.username || 'Unknown'
          };
        })
      );

      return applicationsWithUsernames;
    },
    enabled: isAdmin
  });

  const sendVerificationMessage = async (applicantId: string, isApproved: boolean, spotName: string) => {
    if (!user) return;

    const message = isApproved
      ? t(
          `Congratulations! Your AstroSpot "${spotName}" has been verified successfully. You can now add your time slots and profit from your work!`,
          `恭喜！您的观星点"${spotName}"已成功验证。您现在可以添加时间段并从您的工作中获利！`
        )
      : t(
          `We are sorry to notify that your AstroSpot "${spotName}" application has been rejected. Please check your application materials and submit again!`,
          `很抱歉通知您，您的观星点"${spotName}"申请已被拒绝。请检查您的申请材料并重新提交！`
        );

    const { error } = await supabase
      .from('user_messages')
      .insert({
        sender_id: user.id,
        receiver_id: applicantId,
        message: message
      });

    if (error) {
      console.error('Error sending verification message:', error);
    }
  };

  const handleApplicationDecision = async (application: VerificationApplication, approved: boolean) => {
    if (!user) return;

    setProcessingApplication(application.id);
    try {
      // Update application status
      const { error: appError } = await supabase
        .from('astro_spot_verification_applications')
        .update({
          status: approved ? 'approved' : 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes[application.id] || ''
        })
        .eq('id', application.id);

      if (appError) throw appError;

      // Update spot verification status
      const { error: spotError } = await supabase
        .from('user_astro_spots')
        .update({
          verification_status: approved ? 'verified' : 'rejected'
        })
        .eq('id', application.spot_id);

      if (spotError) throw spotError;

      // Send message to applicant
      await sendVerificationMessage(
        application.applicant_id, 
        approved, 
        application.user_astro_spots.name
      );

      toast.success(
        approved 
          ? t('Application approved successfully', '申请批准成功')
          : t('Application rejected successfully', '申请拒绝成功')
      );

      refetch();
    } catch (error) {
      console.error('Error processing application:', error);
      toast.error(t('Failed to process application', '处理申请失败'));
    } finally {
      setProcessingApplication(null);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    const { data } = supabase.storage.from('verification_materials').getPublicUrl(path);
    return data.publicUrl;
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-400">
          {t('Access denied. Admin privileges required.', '拒绝访问。需要管理员权限。')}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-400">{t('Loading applications...', '加载申请中...')}</p>
      </div>
    );
  }

  const pendingApplications = applications?.filter(app => app.status === 'pending') || [];
  const processedApplications = applications?.filter(app => app.status !== 'pending') || [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-200">
        {t('Verification Applications Management', '验证申请管理')}
      </h1>

      {/* Pending Applications */}
      <div>
        <h2 className="text-xl font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-400" />
          {t('Pending Applications', '待处理申请')} ({pendingApplications.length})
        </h2>

        <div className="grid gap-6">
          {pendingApplications.map((application) => (
            <Card key={application.id} className="bg-cosmic-800/50 border-cosmic-700/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-200">{application.user_astro_spots.name}</span>
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      {t('Pending', '待处理')}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-400">
                    {t('by', '申请者')} @{application.applicant_username}
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">{t('Submitted', '提交时间')}: {format(new Date(application.created_at), 'MMM d, yyyy')}</p>
                    <p className="text-gray-400">{t('Bortle Level', '博特尔等级')}: {application.bortle_level}</p>
                    <p className="text-gray-400">
                      {t('Location', '位置')}: {application.user_astro_spots.latitude.toFixed(4)}, {application.user_astro_spots.longitude.toFixed(4)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/astro-spot/${application.spot_id}`, '_blank')}
                      className="w-full justify-start"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('View AstroSpot Profile', '查看观星点档案')}
                    </Button>
                    
                    {application.facility_images_urls.length > 0 && (
                      <div>
                        <p className="text-gray-400 mb-2">{t('Facility Images', '设施图片')}:</p>
                        <div className="flex flex-wrap gap-2">
                          {application.facility_images_urls.map((url, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(getImageUrl(url), '_blank')}
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {t('Image', '图片')} {index + 1}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {application.accommodation_description && (
                  <div>
                    <p className="text-gray-400 font-medium">{t('Accommodation Details', '住宿详情')}:</p>
                    <p className="text-gray-300 text-sm">{application.accommodation_description}</p>
                  </div>
                )}

                {application.additional_notes && (
                  <div>
                    <p className="text-gray-400 font-medium">{t('Additional Notes', '附加说明')}:</p>
                    <p className="text-gray-300 text-sm">{application.additional_notes}</p>
                  </div>
                )}

                <div>
                  <p className="text-gray-400 font-medium mb-2">{t('Admin Notes', '管理员备注')}:</p>
                  <Textarea
                    value={adminNotes[application.id] || ''}
                    onChange={(e) => setAdminNotes(prev => ({ ...prev, [application.id]: e.target.value }))}
                    placeholder={t('Add notes for this application...', '为此申请添加备注...')}
                    className="bg-cosmic-700/30 border-cosmic-600/50 text-gray-200"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => handleApplicationDecision(application, true)}
                    disabled={processingApplication === application.id}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('Approve', '批准')}
                  </Button>
                  <Button
                    onClick={() => handleApplicationDecision(application, false)}
                    disabled={processingApplication === application.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('Reject', '拒绝')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {pendingApplications.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            {t('No pending applications', '没有待处理的申请')}
          </div>
        )}
      </div>

      {/* Processed Applications */}
      {processedApplications.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-300 mb-4">
            {t('Recent Processed Applications', '最近处理的申请')}
          </h2>
          
          <div className="grid gap-4">
            {processedApplications.slice(0, 5).map((application) => (
              <Card key={application.id} className="bg-cosmic-900/30 border-cosmic-700/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-300">{application.user_astro_spots.name}</span>
                      <Badge
                        variant="outline"
                        className={
                          application.status === 'approved'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }
                      >
                        {application.status === 'approved' ? t('Approved', '已批准') : t('Rejected', '已拒绝')}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      @{application.applicant_username}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationApplicationsManager;
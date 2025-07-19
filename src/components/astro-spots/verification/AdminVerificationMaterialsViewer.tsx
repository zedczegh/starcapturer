import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Eye, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Calendar, 
  User, 
  MapPin,
  Star,
  Loader2
} from 'lucide-react';

interface VerificationMaterial {
  id: string;
  applicant_id: string;
  created_at: string;
  status: string;
  bortle_level: number | null;
  bortle_measurement_url: string | null;
  facility_images_urls: string[] | null;
  accommodation_description: string | null;
  additional_notes: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface AdminVerificationMaterialsViewerProps {
  spotId: string;
}

export function AdminVerificationMaterialsViewer({ spotId }: AdminVerificationMaterialsViewerProps) {
  const { isAdmin } = useUserRole();
  const [applications, setApplications] = useState<VerificationMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!isAdmin || !spotId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('astro_spot_verification_applications')
          .select(`
            *,
            profiles:applicant_id (
              username,
              avatar_url
            )
          `)
          .eq('spot_id', spotId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform the data to match our interface
        const transformedData = (data || []).map(item => ({
          ...item,
          profiles: Array.isArray(item.profiles) && item.profiles.length > 0 
            ? item.profiles[0] 
            : null
        }));
        
        setApplications(transformedData);
      } catch (error) {
        console.error('Error fetching verification applications:', error);
        toast.error('Failed to load verification materials');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [spotId, isAdmin]);

  const downloadFile = async (url: string, filename: string) => {
    if (!url) return;
    
    setDownloadingFile(url);
    try {
      const { data, error } = await supabase.storage
        .from('verification_materials')
        .download(url);

      if (error) throw error;

      const blob = new Blob([data]);
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloadingFile(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      approved: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      rejected: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading verification materials...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Verification Materials
          </CardTitle>
          <CardDescription>
            No verification applications found for this astro spot.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Eye className="h-5 w-5" />
        Verification Materials ({applications.length})
      </h3>
      
      {applications.map((application) => (
        <Card key={application.id} className="border-amber-200 bg-amber-50/5 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Application by @{application.profiles?.username || 'Unknown User'}
              </CardTitle>
              {getStatusBadge(application.status)}
            </div>
            <CardDescription>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(application.created_at).toLocaleDateString()}
                </span>
                {application.bortle_level && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Bortle {application.bortle_level}
                  </span>
                )}
              </div>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Bortle Measurement */}
            {application.bortle_measurement_url && (
              <div className="bg-white/5 p-3 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Bortle Measurement
                </h4>
                <Button
                  onClick={() => downloadFile(application.bortle_measurement_url!, 'bortle-measurement')}
                  disabled={downloadingFile === application.bortle_measurement_url}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  {downloadingFile === application.bortle_measurement_url ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download Bortle Measurement
                </Button>
              </div>
            )}

            {/* Facility Images */}
            {application.facility_images_urls && application.facility_images_urls.length > 0 && (
              <div className="bg-white/5 p-3 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Facility Images ({application.facility_images_urls.length})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {application.facility_images_urls.map((imageUrl, index) => (
                    <Button
                      key={index}
                      onClick={() => downloadFile(imageUrl, `facility-image-${index + 1}`)}
                      disabled={downloadingFile === imageUrl}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      {downloadingFile === imageUrl ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Image {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Accommodation Description */}
            {application.accommodation_description && (
              <div className="bg-white/5 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Accommodation Description</h4>
                <p className="text-sm text-muted-foreground">
                  {application.accommodation_description}
                </p>
              </div>
            )}

            {/* Additional Notes */}
            {application.additional_notes && (
              <div className="bg-white/5 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Additional Notes</h4>
                <p className="text-sm text-muted-foreground">
                  {application.additional_notes}
                </p>
              </div>
            )}

            {/* Admin Notes */}
            {application.admin_notes && (
              <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-400">Admin Notes</h4>
                <p className="text-sm text-blue-300">
                  {application.admin_notes}
                </p>
                {application.reviewed_at && (
                  <p className="text-xs text-blue-400 mt-1">
                    Reviewed on {new Date(application.reviewed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface FilePreviewProps {
  url: string;
  filename: string;
  type: 'image' | 'pdf' | 'document';
}

const FilePreview: React.FC<FilePreviewProps> = ({ url, filename, type }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const getPublicUrl = async (path: string): Promise<string> => {
    try {
      // If it's already a full URL, return it
      if (path.startsWith('http')) {
        return path;
      }
      
      // Get public URL from Supabase storage
      const { data } = supabase.storage
        .from('verification-materials')
        .getPublicUrl(path);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting public URL:', error);
      throw error;
    }
  };

  const handlePreview = async () => {
    if (previewUrl) {
      setIsOpen(true);
      return;
    }

    setLoading(true);
    try {
      const publicUrl = await getPublicUrl(url);
      setPreviewUrl(publicUrl);
      setIsOpen(true);
    } catch (error) {
      console.error('Error loading preview:', error);
      toast.error('Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const openInNewTab = async () => {
    try {
      const publicUrl = await getPublicUrl(url);
      window.open(publicUrl, '_blank');
    } catch (error) {
      console.error('Error opening file:', error);
      toast.error('Failed to open file');
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'image':
        return <Eye className="h-4 w-4" />;
      case 'pdf':
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const renderPreviewContent = () => {
    if (!previewUrl) return null;

    switch (type) {
      case 'image':
        return (
          <div className="max-h-[80vh] max-w-full overflow-auto">
            <img 
              src={previewUrl} 
              alt={filename}
              className="max-w-full h-auto rounded-lg"
              onError={() => {
                toast.error('Failed to load image');
                setIsOpen(false);
              }}
            />
          </div>
        );
      case 'pdf':
        return (
          <div className="w-full h-[80vh]">
            <iframe
              src={previewUrl}
              className="w-full h-full rounded-lg"
              title={filename}
              onError={() => {
                toast.error('Failed to load PDF. Opening in new tab...');
                openInNewTab();
                setIsOpen(false);
              }}
            />
          </div>
        );
      case 'document':
        return (
          <div className="text-center py-8">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">{filename}</p>
            <p className="text-muted-foreground mb-4">
              This document type cannot be previewed inline.
            </p>
            <Button onClick={openInNewTab} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={loading}
              className="flex items-center gap-1"
            >
              {getIcon()}
              {loading ? 'Loading...' : 'Preview'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getIcon()}
                {filename}
              </DialogTitle>
            </DialogHeader>
            {renderPreviewContent()}
          </DialogContent>
        </Dialog>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={openInNewTab}
          className="flex items-center gap-1"
        >
          <ExternalLink className="h-4 w-4" />
          Open
        </Button>
      </div>
    </>
  );
};

interface ApplicationMaterialsProps {
  application: {
    bortle_measurement_url?: string;
    facility_images_urls?: string[];
  };
}

const ApplicationMaterials: React.FC<ApplicationMaterialsProps> = ({ application }) => {
  const getFileType = (url: string): 'image' | 'pdf' | 'document' => {
    const ext = url.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return 'image';
    }
    if (ext === 'pdf') {
      return 'pdf';
    }
    return 'document';
  };

  return (
    <div className="space-y-3">
      {application.bortle_measurement_url && (
        <Card className="bg-cosmic-900/40 border-cosmic-700/40">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Bortle Measurement
                </Badge>
                <span className="text-sm text-cosmic-200">
                  {getFileType(application.bortle_measurement_url) === 'pdf' ? 'PDF Report' : 'Measurement File'}
                </span>
              </div>
              <FilePreview
                url={application.bortle_measurement_url}
                filename="bortle-measurement"
                type={getFileType(application.bortle_measurement_url)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {application.facility_images_urls && application.facility_images_urls.length > 0 && (
        <Card className="bg-cosmic-900/40 border-cosmic-700/40">
          <CardContent className="p-3">
            <div className="mb-3">
              <Badge variant="secondary" className="text-xs">
                Facility Images ({application.facility_images_urls.length})
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {application.facility_images_urls.map((url, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-cosmic-800/60 rounded-lg">
                  <span className="text-sm text-cosmic-200">
                    Image {index + 1}
                  </span>
                  <FilePreview
                    url={url}
                    filename={`facility-image-${index + 1}`}
                    type={getFileType(url)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApplicationMaterials;
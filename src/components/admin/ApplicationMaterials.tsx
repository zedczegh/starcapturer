import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const getPublicUrl = (path: string): string => {
  // If it's already a full URL, return it
  if (path.startsWith('http')) {
    return path;
  }
  
  // Get public URL from Supabase storage
  const { data } = supabase.storage
    .from('verification_materials')
    .getPublicUrl(path);
  
  return data.publicUrl;
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
            <div className="mb-3">
              <Badge variant="secondary" className="text-xs mb-2">
                Bortle Measurement Report
              </Badge>
              {getFileType(application.bortle_measurement_url) === 'image' ? (
                <img 
                  src={getPublicUrl(application.bortle_measurement_url)} 
                  alt="Bortle measurement"
                  className="w-full max-w-md rounded-lg border border-cosmic-700/40"
                />
              ) : getFileType(application.bortle_measurement_url) === 'pdf' ? (
                <iframe
                  src={getPublicUrl(application.bortle_measurement_url)}
                  className="w-full h-64 rounded-lg border border-cosmic-700/40"
                  title="Bortle measurement PDF"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-cosmic-800/60 rounded-lg">
                  <FileText className="h-5 w-5 text-cosmic-300" />
                  <span className="text-sm text-cosmic-200">Bortle Measurement Document</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {application.facility_images_urls && application.facility_images_urls.length > 0 && (
        <Card className="bg-cosmic-900/40 border-cosmic-700/40">
          <CardContent className="p-3">
            <Badge variant="secondary" className="text-xs mb-3">
              Facility Images ({application.facility_images_urls.length})
            </Badge>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {application.facility_images_urls.map((url, index) => (
                <div key={index} className="space-y-2">
                  <span className="text-xs text-cosmic-300">Image {index + 1}</span>
                  {getFileType(url) === 'image' ? (
                    <img 
                      src={getPublicUrl(url)} 
                      alt={`Facility image ${index + 1}`}
                      className="w-full rounded-lg border border-cosmic-700/40 max-h-48 object-cover"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-cosmic-800/60 rounded-lg">
                      <FileText className="h-5 w-5 text-cosmic-300" />
                      <span className="text-sm text-cosmic-200">Document {index + 1}</span>
                    </div>
                  )}
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
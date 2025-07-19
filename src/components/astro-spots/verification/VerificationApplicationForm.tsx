import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';

interface VerificationApplicationFormProps {
  spotId: string;
  spotName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const VerificationApplicationForm: React.FC<VerificationApplicationFormProps> = ({
  spotId,
  spotName,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [bortleLevel, setBortleLevel] = useState<number>(1);
  const [bortleMeasurementFile, setBortleMeasurementFile] = useState<File | null>(null);
  const [facilityImages, setFacilityImages] = useState<File[]>([]);
  const [accommodationDescription, setAccommodationDescription] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handleFileUpload = async (file: File, folder: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const fileName = `${user.id}/${folder}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('verification_materials')
      .upload(fileName, file);
    
    if (error) throw error;
    return fileName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      let bortleMeasurementUrl = '';
      let facilityImageUrls: string[] = [];

      // Upload bortle measurement file if provided
      if (bortleMeasurementFile) {
        bortleMeasurementUrl = await handleFileUpload(bortleMeasurementFile, 'bortle_measurements');
      }

      // Upload facility images
      if (facilityImages.length > 0) {
        facilityImageUrls = await Promise.all(
          facilityImages.map(file => handleFileUpload(file, 'facility_images'))
        );
      }

      // Create verification application
      const { error } = await supabase
        .from('astro_spot_verification_applications')
        .insert({
          spot_id: spotId,
          applicant_id: user.id,
          bortle_level: bortleLevel,
          bortle_measurement_url: bortleMeasurementUrl,
          facility_images_urls: facilityImageUrls,
          accommodation_description: accommodationDescription,
          additional_notes: additionalNotes
        });

      if (error) throw error;

      // Update spot status to pending
      const { error: spotError } = await supabase
        .from('user_astro_spots')
        .update({ verification_status: 'pending' })
        .eq('id', spotId);

      if (spotError) throw spotError;

      toast.success(t('Verification application submitted successfully!', '验证申请提交成功！'));
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting verification application:', error);
      toast.error(t('Failed to submit verification application', '提交验证申请失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleFacilityImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFacilityImages(prev => [...prev, ...files]);
  };

  const removeFacilityImage = (index: number) => {
    setFacilityImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-cosmic-900/95 border-cosmic-700/50">
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-200">
            {t('Apply for AstroSpot Verification', '申请观星点验证')}
          </DialogTitle>
          <p className="text-gray-400 text-sm">
            {t('Submit your materials for', '为')} "{spotName}" {t('verification', '验证提交材料')}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bortle Level */}
          <div>
            <Label className="text-gray-300">
              {t('Measured Bortle Level', '测量的博特尔等级')} *
            </Label>
            <Input
              type="number"
              min="1"
              max="9"
              value={bortleLevel}
              onChange={(e) => setBortleLevel(parseInt(e.target.value))}
              className="bg-cosmic-800/50 border-cosmic-700/50 text-gray-200"
              required
            />
          </div>

          {/* Bortle Measurement File */}
          <div>
            <Label className="text-gray-300">
              {t('Bortle Measurement Document/Screenshot', '博特尔测量文档/截图')}
            </Label>
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setBortleMeasurementFile(e.target.files?.[0] || null)}
              className="bg-cosmic-800/50 border-cosmic-700/50 text-gray-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('Upload screenshot from our Bortle measurement tool or other light pollution data', '上传我们博特尔测量工具的截图或其他光污染数据')}
            </p>
          </div>

          {/* Facility Images */}
          <div>
            <Label className="text-gray-300">
              {t('Facility Pictures', '设施图片')} *
            </Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFacilityImageAdd}
              className="bg-cosmic-800/50 border-cosmic-700/50 text-gray-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('Upload pictures of the observation area, equipment, facilities', '上传观测区域、设备、设施的图片')}
            </p>
            
            {facilityImages.length > 0 && (
              <div className="mt-2 space-y-2">
                {facilityImages.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-cosmic-800/30 p-2 rounded">
                    <span className="text-sm text-gray-300">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFacilityImage(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accommodation Description */}
          <div>
            <Label className="text-gray-300">
              {t('Accommodation Conditions', '住宿条件')}
            </Label>
            <Textarea
              value={accommodationDescription}
              onChange={(e) => setAccommodationDescription(e.target.value)}
              placeholder={t('Describe accommodation facilities if guests can stay overnight...', '如果客人可以过夜，请描述住宿设施...')}
              className="bg-cosmic-800/50 border-cosmic-700/50 text-gray-200 min-h-[100px]"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <Label className="text-gray-300">
              {t('Additional Notes', '附加说明')}
            </Label>
            <Textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder={t('Any additional information about your AstroSpot...', '关于您的观星点的任何附加信息...')}
              className="bg-cosmic-800/50 border-cosmic-700/50 text-gray-200 min-h-[80px]"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-cosmic-700/50 text-gray-300 hover:bg-cosmic-800/50"
            >
              {t('Cancel', '取消')}
            </Button>
            <Button
              type="submit"
              disabled={loading || facilityImages.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('Submitting...', '提交中...')}
                </>
              ) : (
                t('Submit Application', '提交申请')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationApplicationForm;
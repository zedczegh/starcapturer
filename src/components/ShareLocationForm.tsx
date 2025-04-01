
// Import necessary libraries and components
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { shareAstroSpot, SharedAstroSpot } from '@/lib/api/astroSpots';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { MapPin, Award } from "lucide-react";

// Location data interface
interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  description?: string;
  certification?: string; 
  isDarkSkyReserve?: boolean;
  photographer?: string;
}

const ShareLocationForm: React.FC<{
  locationData?: LocationData;
}> = ({ locationData }) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  
  // Form state
  const [name, setName] = useState(locationData?.name || '');
  const [chineseName, setChineseName] = useState('');
  const [latitude, setLatitude] = useState(locationData?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(locationData?.longitude?.toString() || '');
  const [bortleScale, setBortleScale] = useState(locationData?.bortleScale?.toString() || '4');
  const [description, setDescription] = useState(locationData?.description || '');
  const [certification, setCertification] = useState(locationData?.certification || '');
  const [isDarkSkyReserve, setIsDarkSkyReserve] = useState(locationData?.isDarkSkyReserve || false);
  const [photographer, setPhotographer] = useState(locationData?.photographer || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !latitude || !longitude) {
      toast.error(
        language === 'en' ? 'Please fill all required fields' : '请填写所有必填字段'
      );
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create spot data object
      const spotData: Omit<SharedAstroSpot, 'id'> = {
        name,
        chineseName: chineseName || undefined,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        bortleScale: parseInt(bortleScale),
        description: description || undefined,
        timestamp: new Date().toISOString(),
        isDarkSkyReserve: isDarkSkyReserve,
        certification: certification || undefined,
        photographer: photographer || undefined
      };
      
      // Call API to share the spot
      const response = await shareAstroSpot(spotData);
      
      if (response.success) {
        toast.success(
          language === 'en' ? 'Location shared successfully!' : '位置分享成功！'
        );
        
        // Navigate to location page if ID is returned
        if (response.id) {
          navigate(`/location/${response.id}`);
        } else {
          navigate('/photo-points');
        }
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      toast.error(
        language === 'en' ? 'Failed to share location' : '分享位置失败',
        { description: (error as Error).message }
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Certification options - Using real Dark Sky International certification tiers
  const certificationOptions = [
    { value: '', label: t('None', '无') },
    { value: 'International Dark Sky Park', label: t('International Dark Sky Park', '国际暗夜公园') },
    { value: 'International Dark Sky Reserve', label: t('International Dark Sky Reserve', '国际暗夜保护区') },
    { value: 'International Dark Sky Sanctuary', label: t('International Dark Sky Sanctuary', '国际暗夜保护地') },
    { value: 'Dark Sky Community', label: t('Dark Sky Community', '暗夜社区') },
    { value: 'Urban Night Sky Place', label: t('Urban Night Sky Place', '城市暗夜场所') },
    { value: 'Dark Sky Friendly Development of Distinction', label: t('Dark Sky Friendly Development', '暗夜友好开发区') }
  ];
  
  return (
    <Card className="p-6 mx-auto max-w-md w-full glassmorphism border-cosmic-700/30">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('Location Name', '位置名称')} *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('e.g. Mauna Kea Observatory', '例如：毛纳凯阿天文台')}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="chineseName">{t('Chinese Name (Optional)', '中文名称（可选）')}</Label>
          <Input
            id="chineseName"
            value={chineseName}
            onChange={(e) => setChineseName(e.target.value)}
            placeholder={t('Chinese translation of the name', '名称的中文翻译')}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">{t('Latitude', '纬度')} *</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 42.123"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">{t('Longitude', '经度')} *</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. -123.456"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bortleScale">{t('Bortle Scale (1-9)', '波尔特尔亮度等级 (1-9)')}</Label>
          <Select value={bortleScale} onValueChange={setBortleScale}>
            <SelectTrigger>
              <SelectValue placeholder={t('Select Bortle scale', '选择波尔特尔亮度等级')} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((value) => (
                <SelectItem key={value} value={value.toString()}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="certification">{t('Dark Sky Certification', '暗夜认证')}</Label>
          <Select value={certification} onValueChange={setCertification}>
            <SelectTrigger>
              <SelectValue placeholder={t('Select certification (if any)', '选择认证（如有）')} />
            </SelectTrigger>
            <SelectContent>
              {certificationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            id="isDarkSkyReserve"
            type="checkbox"
            checked={isDarkSkyReserve}
            onChange={(e) => setIsDarkSkyReserve(e.target.checked)}
            className="h-4 w-4 rounded border-cosmic-600 text-primary focus:ring-primary/30"
          />
          <Label htmlFor="isDarkSkyReserve" className="flex items-center gap-2">
            <Award className="h-4 w-4 text-blue-400" />
            {t('Is Dark Sky Reserve', '是暗夜保护区')}
          </Label>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="photographer">{t('Photographer Name (Optional)', '摄影师姓名（可选）')}</Label>
          <Input
            id="photographer"
            value={photographer}
            onChange={(e) => setPhotographer(e.target.value)}
            placeholder={t('Your name or nickname', '您的姓名或昵称')}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">{t('Description (Optional)', '描述（可选）')}</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('Describe this location and its sky viewing conditions', '描述此位置及其观星条件')}
            rows={4}
          />
        </div>
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              {language === 'en' ? 'Submitting...' : '提交中...'}
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              {t('Share Location', '分享位置')}
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};

export default ShareLocationForm;

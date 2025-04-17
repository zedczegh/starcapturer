
import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiqsNavigation } from '@/hooks/navigation/useSiqsNavigation';
import { toast } from 'sonner';

const LocationPinButton: React.FC = () => {
  const { t } = useLanguage();
  const { getPosition } = useSiqsNavigation();
  
  const handleGetLocation = () => {
    toast.success(t("Finding your location...", "正在定位您的位置..."));
    getPosition();
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleGetLocation} 
      className="relative transition-all duration-300 hover:bg-primary/20"
      title={t("Update to your current location", "更新到您的当前位置")}
    >
      <MapPin className="h-5 w-5" />
    </Button>
  );
};

export default LocationPinButton;

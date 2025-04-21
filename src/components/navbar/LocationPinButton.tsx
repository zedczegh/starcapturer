
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

const LocationPinButton: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleCollectionsShortcut = () => {
    if (isNavigating) return; // Prevent multiple clicks
    
    if (!user) {
      toast({
        description: t("Please sign up to use our collected locations service.", "请注册以使用我们的收藏位置服务。"),
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setIsNavigating(true);
    navigate('/collections');
    
    // Reset navigation state after a delay to prevent double-clicks
    setTimeout(() => setIsNavigating(false), 1000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCollectionsShortcut}
      className={`relative transition-all duration-300 hover:bg-primary/20 ${isNavigating ? 'opacity-70' : ''}`}
      title={t('Go to My Collections', '前往我的收藏')}
      aria-label={t('Go to My Collections', '前往我的收藏')}
      disabled={isNavigating}
    >
      <Pin className={`h-5 w-5 ${isNavigating ? 'text-muted' : 'text-primary'}`} />
    </Button>
  );
};

export default LocationPinButton;

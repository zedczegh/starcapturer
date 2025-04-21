
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "@/hooks/use-toast";

const LocationPinButton: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCollectionsShortcut = () => {
    if (!user) {
      toast({
        title: t("Sign up required", "需要注册"),
        description: t("Please sign up to use our collected locations service.", "请注册以使用我们的收藏位置服务。"),
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    navigate('/collections');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCollectionsShortcut}
      className="relative transition-all duration-300 hover:bg-primary/20"
      title={t('Go to My Collections', '前往我的收藏')}
      aria-label={t('Go to My Collections', '前往我的收藏')}
    >
      <Pin className="h-5 w-5 text-primary" />
    </Button>
  );
};

export default LocationPinButton;

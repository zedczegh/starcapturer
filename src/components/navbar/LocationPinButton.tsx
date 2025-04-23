
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "@/hooks/use-toast";

const LocationPinButton: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Go to community page for all users (no auth required)
  const handleCommunityShortcut = () => {
    navigate('/community');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCommunityShortcut}
      className="relative transition-all duration-300 hover:bg-primary/20"
      title={t('Community Astrospots', '社区观星地')}
      aria-label={t('Community Astrospots', '社区观星地')}
    >
      <Pin className="h-5 w-5 text-primary" />
    </Button>
  );
};

export default LocationPinButton;

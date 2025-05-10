
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import SpotHeader from '@/components/astro-spots/profile/SpotHeader';
import { Button } from '@/components/ui/button';
import { Share } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProfileHeaderSectionProps {
  spot: any;
  creatorProfile: any;
  loadingCreator: boolean;
  onViewDetails: () => void;
  comingFromCommunity: boolean;
  onMessageCreator: () => void;
}

const ProfileHeaderSection: React.FC<ProfileHeaderSectionProps> = ({
  spot,
  creatorProfile,
  loadingCreator,
  onViewDetails,
  comingFromCommunity,
  onMessageCreator
}) => {
  const { t } = useLanguage();
  
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/astro-spot/${spot.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: t("Link copied to clipboard", "链接已复制到剪贴板"),
        description: t("You can now share this location with others", "您现在可以与他人分享此位置")
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: t("Failed to copy link", "复制链接失败"),
        description: shareUrl,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="relative">
      <SpotHeader
        spot={spot}
        creatorProfile={creatorProfile}
        loadingCreator={loadingCreator}
        spotId={spot.user_id}
        onViewDetails={onViewDetails}
        comingFromCommunity={comingFromCommunity}
      />
      
      <Button 
        variant="secondary"
        size="sm" 
        className="absolute top-2 right-2 bg-cosmic-900/60 hover:bg-cosmic-800/70 text-white"
        onClick={handleShare}
      >
        <Share className="h-4 w-4 mr-1" />
        {t("Share", "分享")}
      </Button>
    </div>
  );
};

export default ProfileHeaderSection;

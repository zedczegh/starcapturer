
import React from 'react';
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star, ExternalLink, MessageSquare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import defaultAvatar from "@/assets/default-avatar.png";

interface ProfileHeaderSectionProps {
  spot: any;
  creatorProfile: any;
  loadingCreator: boolean;
  onViewDetails: () => void;
  comingFromCommunity: boolean;
  onMessageCreator: () => void;
  onShareProfile?: () => void;
}

const ProfileHeaderSection: React.FC<ProfileHeaderSectionProps> = ({
  spot,
  creatorProfile,
  loadingCreator,
  onViewDetails,
  comingFromCommunity,
  onMessageCreator,
  onShareProfile
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Share button handler that uses the provided callback or falls back to default implementation
  const handleShare = () => {
    if (onShareProfile) {
      onShareProfile();
    } else {
      // Default share implementation
      const profileUrl = window.location.href;
      navigator.clipboard.writeText(profileUrl)
        .then(() => {
          toast.success(t("Link copied to clipboard!", "链接已复制到剪贴板！"));
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          toast.error(t("Failed to copy link", "复制链接失败"));
        });
    }
  };
  
  return (
    <div className="p-6 pb-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{spot?.name}</h1>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShare}
            className="flex items-center gap-1.5 bg-background/70 text-foreground hover:bg-cosmic-800/50"
          >
            <Share2 className="h-4 w-4" />
            {t("Share", "分享")}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewDetails}
            className="flex items-center gap-1.5 bg-background/70 text-foreground hover:bg-cosmic-800/50"
          >
            <ExternalLink className="h-4 w-4" />
            {t("View Details", "查看详情")}
          </Button>
          
          {comingFromCommunity && creatorProfile && !loadingCreator && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onMessageCreator}
              className="flex items-center gap-1.5"
            >
              <MessageSquare className="h-4 w-4" />
              {t("Message Creator", "联系创建者")}
            </Button>
          )}
        </div>
      </div>

      {/* Creator information section - improved with avatar */}
      <div className="text-sm text-muted-foreground mb-4 flex items-center flex-wrap gap-2">
        {spot?.latitude && spot?.longitude && (
          <span>{spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}</span>
        )}
        {spot && spot.created_at && (
          <>
            <span className="opacity-60">•</span>
            <span>
              {t("Created", "创建于")} {new Date(spot.created_at).toLocaleDateString()}
            </span>
          </>
        )}
        
        {/* Restored creator profile section with avatar */}
        {creatorProfile && !loadingCreator && (
          <>
            <span className="opacity-60">•</span>
            <div className="flex items-center gap-1.5 bg-cosmic-900/30 px-2 py-1 rounded-full">
              <Avatar className="h-6 w-6 border border-cosmic-700/50">
                <AvatarImage 
                  src={creatorProfile.avatar_url || defaultAvatar} 
                  alt={creatorProfile.username || t("Anonymous", "匿名用户")} 
                />
                <AvatarFallback className="bg-cosmic-800 text-xs">
                  {(creatorProfile.username || t("?", "?"))[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{creatorProfile.username || t("Anonymous", "匿名用户")}</span>
            </div>
          </>
        )}
      </div>

      {/* Types and advantages badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {spot?.astro_spot_types?.map((type: any, index: number) => (
          <Badge 
            key={`type-${index}`} 
            variant="outline"
            className="bg-cosmic-800/50"
          >
            {type.type}
          </Badge>
        ))}
        
        {spot?.astro_spot_advantages?.map((advantage: any, index: number) => (
          <Badge 
            key={`adv-${index}`} 
            variant="outline"
            className="bg-cosmic-900/50 border-cosmic-600/50"
          >
            {advantage.advantage}
          </Badge>
        ))}
      </div>

      {/* Description section */}
      {spot?.description && (
        <div className="mt-4 text-gray-300">
          <p className="whitespace-pre-wrap">{spot.description}</p>
        </div>
      )}
    </div>
  );
};

export default ProfileHeaderSection;

import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, MapPin, Star, Calendar, Award } from "lucide-react";
import { formatSIQSScore } from "@/utils/mapUtils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ShareLocationButton from "@/components/location/ShareLocationButton";

interface ProfileHeaderSectionProps {
  spot: any;
  formatDate: (date: string) => string;
}

const ProfileHeaderSection = ({ spot, formatDate }: ProfileHeaderSectionProps) => {
  const { language, t } = useLanguage();
  
  const siqs = spot?.siqs || spot?.siqsResult?.score;
  const formattedSiqs = formatSIQSScore(siqs);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start gap-2 md:items-center">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-primary-foreground/90">
            {spot?.name || t("Unnamed Location", "未命名位置")}
          </h1>
          {spot?.name_zh && language === 'en' && (
            <span className="text-sm text-primary-foreground/70 mt-1">
              {spot.name_zh}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {spot?.id && <ShareLocationButton locationId={spot.id} />}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {spot?.is_certified && (
          <Badge variant="secondary" className="opacity-90">
            <Shield className="mr-2 h-4 w-4" />
            {t("Certified Spot", "认证地点")}
          </Badge>
        )}
        {spot?.siqs && (
          <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">
            <Star className="mr-2 h-4 w-4" fill="#facc15" />
            {formattedSiqs} SIQS
          </Badge>
        )}
      </div>

      <div className="flex items-center space-x-4 text-sm text-primary-foreground/80">
        {spot?.latitude && spot?.longitude && (
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4" />
            {spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}
          </div>
        )}
        {spot?.created_at && (
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            {t("Added on", "添加于")} {formatDate(spot.created_at)}
          </div>
        )}
        {spot?.user && (
          <div className="flex items-center">
            <Award className="mr-2 h-4 w-4" />
            {t("Added by", "添加者")}
            <Avatar
              src={spot.user.avatar_url}
              alt={spot.user.username}
              className="ml-1 h-5 w-5"
            />
            {spot.user.username}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeaderSection;

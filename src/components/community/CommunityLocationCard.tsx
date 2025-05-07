
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, ChevronRight } from 'lucide-react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import SiqsScoreBadge from '../photoPoints/cards/SiqsScoreBadge';
import { useLanguage } from '@/contexts/LanguageContext';

interface CommunityLocationCardProps {
  location: SharedAstroSpot;
  realTimeSiqs: number | null;
  isLoading: boolean;
}

const CommunityLocationCard: React.FC<CommunityLocationCardProps> = ({
  location,
  realTimeSiqs,
  isLoading
}) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  
  // Display name based on language
  const displayName = language === 'zh' && location.chineseName 
    ? location.chineseName
    : location.name || t("Unnamed Location", "未命名位置");

  const handleCardClick = () => {
    navigate(`/location/${location.id}`, {
      state: { from: 'community' }
    });
  };

  return (
    <Card 
      className="mb-4 hover:shadow-md transition-shadow cursor-pointer bg-cosmic-900/50 border-cosmic-800"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-medium text-slate-100">
              {displayName}
            </h3>
            <div className="text-xs text-muted-foreground flex items-center mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </div>
            {location.certification && (
              <Badge variant="outline" className="mt-2 bg-primary/10 text-xs">
                {location.certification}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center">
            <SiqsScoreBadge 
              score={realTimeSiqs || location.siqs} 
              loading={isLoading} 
            />
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(CommunityLocationCard);

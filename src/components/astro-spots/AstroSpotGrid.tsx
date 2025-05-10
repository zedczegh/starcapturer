import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { formatDistance } from "@/utils/geoUtils";
import SiqsScoreBadge from "@/components/photoPoints/cards/SiqsScoreBadge"; 
import { MapPin, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSiqsScore } from "@/utils/siqsHelpers";
import { motion } from "framer-motion";
import MiniRemoveButton from "@/components/collections/MiniRemoveButton";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";

interface AstroSpotGridProps {
  spots: SharedAstroSpot[];
  editMode: boolean;
  onDelete: (spotId: string) => Promise<void>;
  onSiqsCalculated: (spotId: string, siqs: number | null, loading: boolean) => void;
  realTimeSiqs: Record<string, number | null>;
}

interface AstroSpotCardProps {
  spot: SharedAstroSpot;
  onClick: (spot: SharedAstroSpot) => void;
}

const AstroSpotCard: React.FC<AstroSpotCardProps> = ({ spot, onClick }) => {
  const { t, language } = useLanguage();
  
  // Get name based on language
  const displayName = language === "zh" && spot.chineseName 
    ? spot.chineseName 
    : spot.name;
  
  // Safely handle SIQS score - handle complex objects
  const siqsScore = getSiqsScore(spot.siqs);

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] bg-card border border-border/50"
      onClick={() => onClick(spot)}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium line-clamp-1">{displayName}</h3>
            <SiqsScoreBadge 
              score={siqsScore} 
              compact
            />
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4 opacity-70" />
            {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
          </div>
          
          {spot.isDarkSkyReserve && (
            <div className="flex items-center text-xs text-primary">
              <Star className="mr-2 h-4 w-4" />
              {t("Dark Sky Reserve", "暗夜天空保护区")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const AstroSpotGrid: React.FC<AstroSpotGridProps> = ({
  spots,
  editMode,
  onDelete,
  onSiqsCalculated,
  realTimeSiqs
}) => {
  const navigate = useNavigate();
  
  const handleSpotClick = (spot: SharedAstroSpot) => {
    if (!editMode) {
      console.log("Navigating to astro spot profile:", spot.id);
      navigate(`/astro-spot/${spot.id}`);
    }
  };
  
  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {spots.map((spot, index) => (
        <motion.div
          key={spot.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.10 }}
          className="relative group"
        >
          {editMode && (
            <div className="absolute top-3 right-3 z-20">
              <MiniRemoveButton onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(spot.id);
              }} />
            </div>
          )}
          <RealTimeSiqsProvider
            isVisible={true}
            latitude={spot.latitude}
            longitude={spot.longitude}
            bortleScale={spot.bortleScale}
            existingSiqs={spot.siqs}
            onSiqsCalculated={(siqs, loading) => onSiqsCalculated(spot.id, siqs, loading)}
          />
          <div className={`cursor-${editMode ? 'default' : 'pointer'} transition duration-200 hover:scale-[1.025]`} onClick={() => handleSpotClick(spot)}>
            <AstroSpotCard spot={spot} onClick={() => handleSpotClick(spot)}/>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AstroSpotGrid;

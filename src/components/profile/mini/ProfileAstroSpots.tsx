
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2 } from "@/components/ui/loader";
import LocationCard from "@/components/LocationCard";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";

interface ProfileAstroSpotsProps {
  sortedAstroSpots: any[];
  loadingSpots: boolean;
  realTimeSiqs: Record<string, number | null>;
  profileId: string | undefined;
  navigate: (path: string) => void;
  handleSiqsCalculated: (spotId: string, siqs: number | null, loading: boolean) => void;
  t: (en: string, zh: string) => string;
}

const ProfileAstroSpots: React.FC<ProfileAstroSpotsProps> = ({
  sortedAstroSpots,
  loadingSpots,
  realTimeSiqs,
  profileId,
  navigate,
  handleSiqsCalculated,
  t
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-4 mb-6"
    >
      <h3 className="text-cosmic-200 text-sm font-medium mb-3 flex items-center">
        {t("AstroSpots Created", "创建的观星点")}
        <span className="text-xs text-muted-foreground ml-2">
          ({t("Best SIQS first", "最佳SIQS排前")})
        </span>
      </h3>
      
      {loadingSpots ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : sortedAstroSpots.length > 0 ? (
        <div className="space-y-4">
          {sortedAstroSpots.map(spot => (
            <div 
              key={spot.id} 
              className="cursor-pointer transition duration-200 hover:scale-[1.02]"
              onClick={() => navigate(`/astro-spot/${spot.id}`)}
            >
              <RealTimeSiqsProvider
                isVisible={true}
                latitude={spot.latitude}
                longitude={spot.longitude}
                bortleScale={spot.bortleScale}
                existingSiqs={spot.siqs}
                onSiqsCalculated={(siqs, loading) =>
                  handleSiqsCalculated(spot.id, siqs, loading)
                }
              />
              <LocationCard
                id={spot.id}
                name={spot.name}
                latitude={spot.latitude}
                longitude={spot.longitude}
                siqs={realTimeSiqs[spot.id] !== undefined ? realTimeSiqs[spot.id] : spot.siqs}
                timestamp={spot.timestamp || spot.created_at} // Use timestamp or fallback to created_at
                isCertified={false}
              />
            </div>
          ))}
          
          {sortedAstroSpots.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2" 
              onClick={() => navigate(`/community?userId=${profileId}`)}
            >
              {t("View All AstroSpots", "查看所有观星点")}
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center py-4 bg-cosmic-800/30 rounded-lg border border-cosmic-700/30">
          <p className="text-cosmic-400 text-sm">{t("No AstroSpots created yet", "暂无创建的观星点")}</p>
        </div>
      )}
    </motion.div>
  );
};

export default ProfileAstroSpots;


import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { Loader2 } from "@/components/ui/loader";
import CommunityLocationCard from "./CommunityLocationCard";
import CommunitySiqsProvider from "./CommunitySiqsProvider";
import { getSiqsScore } from "@/utils/siqsHelpers";

interface CommunityLocationsListProps {
  isLoading: boolean;
  sortedAstroSpots: SharedAstroSpot[];
  realTimeSiqs: Record<string, number | null>;
  onSiqsCalculated: (spotId: string, siqs: number | null, loading: boolean) => void;
}

const CommunityLocationsList: React.FC<CommunityLocationsListProps> = ({
  isLoading,
  sortedAstroSpots,
  realTimeSiqs,
  onSiqsCalculated
}) => {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex justify-center my-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/80" />
      </div>
    );
  }

  if (!sortedAstroSpots.length) {
    return (
      <div className="text-center my-12 text-muted-foreground">
        {t("No locations found", "未找到位置")}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-5">
        {t("Astronomy Locations", "观星位置")}
      </h2>
      
      {sortedAstroSpots.map((spot) => (
        <React.Fragment key={spot.id}>
          <CommunityLocationCard
            location={spot}
            realTimeSiqs={realTimeSiqs[spot.id] !== undefined ? getSiqsScore(realTimeSiqs[spot.id]) : null}
            isLoading={Boolean(spot.id && realTimeSiqs[spot.id] === undefined)}
          />
          
          <CommunitySiqsProvider
            locationId={spot.id}
            latitude={spot.latitude}
            longitude={spot.longitude}
            siqs={spot.siqs}
            onSiqsCalculated={onSiqsCalculated}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

export default CommunityLocationsList;


import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import LocationCard from "@/components/LocationCard";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";

interface CommunityAstroSpotsListProps {
  spots: SharedAstroSpot[];
  realTimeSiqs: Record<string, number | null>;
  handleSiqsCalculated: (spotId: string, siqs: number | null, loading: boolean) => void;
  handleCardClick: (id: string) => void;
}

const CommunityAstroSpotsList: React.FC<CommunityAstroSpotsListProps> = ({
  spots,
  realTimeSiqs,
  handleSiqsCalculated,
  handleCardClick
}) => {
  const { t } = useLanguage();

  if (!spots || spots.length === 0) {
    return (
      <div className="w-full text-muted-foreground/70 text-center py-16">
        {t("No community astrospots yet. Be the first to share!", "还没有社区观星点，快来分享吧！")}
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      {spots.map((spot) => (
        <button
          key={spot.id}
          className="relative text-left group focus:outline-none rounded-xl transition duration-150 ease-in-out hover:shadow-2xl hover:border-primary border-2 border-transparent"
          tabIndex={0}
          onClick={() => handleCardClick(spot.id)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleCardClick(spot.id);
            }
          }}
          aria-label={spot.name}
          style={{ background: "none", padding: 0 }}
        >
          <div className="w-full h-full">
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
            <div className="transition-shadow group-hover:shadow-xl group-hover:ring-2 group-hover:ring-primary rounded-xl">
              <LocationCard
                id={spot.id}
                name={spot.name}
                latitude={spot.latitude}
                longitude={spot.longitude}
                siqs={realTimeSiqs[spot.id] !== undefined ? realTimeSiqs[spot.id] : spot.siqs}
                timestamp={spot.timestamp}
                isCertified={false}
              />
            </div>
            <span className="absolute inset-0 rounded-xl z-10 transition bg-black/0 group-hover:bg-primary/5" />
          </div>
        </button>
      ))}
    </div>
  );
};

export default CommunityAstroSpotsList;

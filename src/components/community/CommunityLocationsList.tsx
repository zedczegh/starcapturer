
import React from "react";
import { useNavigate } from "react-router-dom";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import LocationCard from "@/components/LocationCard";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { useLanguage } from "@/contexts/LanguageContext";
import CommunityLocationsSkeleton from "./CommunityLocationsSkeleton";

interface CommunityLocationsListProps {
  locations: SharedAstroSpot[] | null;
  isLoading: boolean;
}

const CommunityLocationsList: React.FC<CommunityLocationsListProps> = ({ locations, isLoading }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [realTimeSiqs, setRealTimeSiqs] = React.useState<Record<string, number | null>>({});
  const [loadingSiqs, setLoadingSiqs] = React.useState<Record<string, boolean>>({});
  const [attemptedSiqs, setAttemptedSiqs] = React.useState<Set<string>>(new Set());

  const debouncedSiqsUpdate = useDebouncedCallback((spotId: string, siqs: number | null, loading: boolean) => {
    setRealTimeSiqs(prev => ({
      ...prev,
      [spotId]: siqs
    }));
    setLoadingSiqs(prev => ({
      ...prev,
      [spotId]: loading
    }));
    
    if (!loading) {
      setAttemptedSiqs(prev => {
        const updated = new Set(prev);
        updated.add(spotId);
        return updated;
      });
    }
  }, 300);

  const handleCardClick = React.useCallback((id: string) => {
    navigate(`/astro-spot/${id}`, { 
      state: { from: 'community' } 
    });
  }, [navigate]);

  if (isLoading) {
    return <CommunityLocationsSkeleton />;
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="w-full text-muted-foreground/70 text-center py-16">
        {t("No community astrospots yet. Be the first to share!", "还没有社区观星点，快来分享吧！")}
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      {locations.map((spot: any) => (
        <button
          key={spot.id}
          className="relative text-left group focus:outline-none rounded-xl transition duration-150 ease-in-out hover:shadow-2xl hover:border-primary border-2 border-transparent"
          onClick={() => handleCardClick(spot.id)}
          aria-label={spot.name}
          style={{ background: "none", padding: 0 }}
        >
          <div className="w-full h-full">
            <RealTimeSiqsProvider
              key={`siqs-provider-${spot.id}`}
              isVisible={true}
              latitude={spot.latitude}
              longitude={spot.longitude}
              bortleScale={spot.bortleScale || 4}
              existingSiqs={spot.siqs}
              onSiqsCalculated={(siqs, loading) =>
                debouncedSiqsUpdate(spot.id, siqs, loading)
              }
              forceUpdate={!attemptedSiqs.has(spot.id)}
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
                username={spot.username}
              />
            </div>
            <span className="absolute inset-0 rounded-xl z-10 transition bg-black/0 group-hover:bg-primary/5" />
          </div>
        </button>
      ))}
    </div>
  );
};

export default CommunityLocationsList;

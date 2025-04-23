
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAstroSpots } from "@/lib/api/fetchCommunityAstroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import LazyMapContainer from "@/components/photoPoints/map/LazyMapContainer";
import { Loader, Star, Circle } from "lucide-react";
import BackButton from "@/components/navigation/BackButton";
import LocationCard from "@/components/LocationCard";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";

const DEFAULT_CENTER: [number, number] = [30, 104];

const CommunityAstroSpots: React.FC = () => {
  const { t } = useLanguage();
  const { data: astrospots, isLoading } = useQuery({
    queryKey: ["community-astrospots-supabase"],
    queryFn: fetchCommunityAstroSpots,
  });

  // Manage SIQS state like in ManageAstroSpots
  const [realTimeSiqs, setRealTimeSiqs] = useState<Record<string, number | null>>({});
  const [loadingSiqs, setLoadingSiqs] = useState<Record<string, boolean>>({});

  const handleSiqsCalculated = (spotId: string, siqs: number | null, loading: boolean) => {
    setRealTimeSiqs(prev => ({
      ...prev,
      [spotId]: siqs
    }));
    setLoadingSiqs(prev => ({
      ...prev,
      [spotId]: loading
    }));
  };

  return (
    <div className="max-w-5xl mx-auto pt-8 px-3 pb-12">
      <div className="flex items-center gap-4 mb-5">
        <BackButton destination="/" className="shrink-0" />
        <div className="inline-flex items-center rounded-full px-3 py-1.5 bg-gradient-to-r from-primary/80 to-blue-400/20 border border-primary/20">
          <Star className="h-4 w-4 mr-1 text-primary" />
          <span className="text-xs font-semibold text-primary">{t("Community Astrospots", "社区观星地点")}</span>
        </div>
      </div>
      <h1 className="text-3xl md:text-4xl font-extrabold text-gradient-blue mb-2 drop-shadow tracking-tight">
        {t("Explore Shared Stargazing Spots", "探索社区拍摄点")}
      </h1>
      <p className="mb-8 text-muted-foreground max-w-2xl text-lg leading-relaxed">
        {t(
          "Discover and explore astrospots contributed by our SIQS community members. View their favorite stargazing locations on the interactive map and find inspiration for your next adventure.",
          "由SIQS成员贡献的社区观星地，尽在此处。浏览他们推荐的拍摄位置，探索地图，发现适合你下次观星之旅的灵感。"
        )}
      </p>

      <div className="rounded-xl mb-9 shadow-glow overflow-hidden ring-1 ring-cosmic-700/10 bg-gradient-to-tr from-cosmic-900 via-cosmic-800/90 to-blue-950/70 border border-cosmic-700/20" style={{ height: 380, minHeight: 275 }}>
        {isLoading ? (
          <div className="flex justify-center items-center h-full w-full bg-cosmic-800/10">
            <Loader className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <LazyMapContainer
            center={DEFAULT_CENTER}
            userLocation={null}
            locations={astrospots ?? []}
            searchRadius={10000}
            activeView="calculated"
            zoom={3}
            hoveredLocationId={null}
          />
        )}
      </div>

      <h2 className="font-bold text-xl mt-10 mb-4 flex items-center gap-2">
        <Circle className="h-4 w-4 text-primary" />
        <span>{t("All Community Astrospots", "全部社区地点")}</span>
      </h2>
      {astrospots && astrospots.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {astrospots.map((spot: any) => (
            <div key={spot.id} className="relative">
              <RealTimeSiqsProvider
                isVisible={true}
                latitude={spot.latitude}
                longitude={spot.longitude}
                bortleScale={spot.bortleScale} // Bortle scale is needed for calculation, but not displayed
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
                timestamp={spot.timestamp}
                isCertified={false}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full text-muted-foreground/70 text-center py-16">
          {t("No community astrospots yet. Be the first to share!", "还没有社区观星点，快来分享吧！")}
        </div>
      )}
    </div>
  );
};

export default CommunityAstroSpots;


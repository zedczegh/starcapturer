
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAstroSpots } from "@/lib/api/fetchCommunityAstroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader, Star } from "lucide-react";
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

  // For each spot's real-time SIQS and loading states
  const [realTimeSiqs, setRealTimeSiqs] = useState<Record<string, number | null>>({});
  const [loadingSiqs, setLoadingSiqs] = useState<Record<string, boolean>>({});

  const handleSiqsCalculated = (spotId: string, siqs: number | null, loading: boolean) => {
    setRealTimeSiqs((prev) => ({ ...prev, [spotId]: siqs }));
    setLoadingSiqs((prev) => ({ ...prev, [spotId]: loading }));
  };

  return (
    <div className="max-w-5xl mx-auto pt-10 px-2 pb-16">
      <div className="flex items-center gap-4 mb-6">
        <BackButton destination="/" className="shrink-0" />
        <div className="inline-flex items-center rounded-full px-3 py-1.5 bg-gradient-to-r from-primary/85 to-blue-400/30 border border-primary/30 shadow">
          <Star className="h-4 w-4 mr-1 text-primary" />
          <span className="text-xs font-semibold text-primary">
            {t("Community Astrospots", "社区观星地点")}
          </span>
        </div>
      </div>
      <h1 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight text-gradient bg-gradient-to-r from-primary via-blue-400 to-cosmic-400 bg-clip-text text-transparent drop-shadow">
        {t("Explore Shared Stargazing Spots", "探索社区拍摄点")}
      </h1>
      <p className="mb-10 text-muted-foreground max-w-2xl text-lg leading-relaxed">
        {t(
          "Discover astrospots contributed by our SIQS community members. View their favorite stargazing locations as beautiful cards in an easy-to-explore list.",
          "由SIQS成员贡献的社区观星地，尽在此处。浏览大家分享的拍摄位置，发现适合你下次观星之旅的灵感！"
        )}
      </p>

      <div className="mb-8">
        <h2 className="font-bold text-xl mb-4 pl-3 tracking-wide">
          {t("All Community Astrospots", "全部社区地点")}
        </h2>
        {isLoading ? (
          <div className="flex justify-center items-center h-48 w-full bg-cosmic-900/30 rounded-xl border border-cosmic-700/15 shadow-inner">
            <Loader className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : astrospots && astrospots.length > 0 ? (
          <div className="grid gap-7 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {astrospots.map((spot: any, index: number) => (
              <div key={spot.id} className="relative">
                <RealTimeSiqsProvider
                  isVisible={true}
                  latitude={spot.latitude}
                  longitude={spot.longitude}
                  bortleScale={spot.bortleScale}
                  existingSiqs={spot.siqs}
                  onSiqsCalculated={(siqs, loading) => handleSiqsCalculated(spot.id, siqs, loading)}
                />
                <LocationCard
                  id={spot.id}
                  name={spot.name}
                  latitude={spot.latitude}
                  longitude={spot.longitude}
                  siqs={
                    realTimeSiqs[spot.id] !== undefined
                      ? realTimeSiqs[spot.id]
                      : spot.siqs
                  }
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
    </div>
  );
};

export default CommunityAstroSpots;


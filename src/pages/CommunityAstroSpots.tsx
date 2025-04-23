
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAstroSpots } from "@/lib/api/fetchCommunityAstroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import LazyMapContainer from "@/components/photoPoints/map/LazyMapContainer";
import { Loader, Star, Circle } from "lucide-react";
import BackButton from "@/components/navigation/BackButton";

const DEFAULT_CENTER: [number, number] = [30, 104];

const CommunityAstroSpots: React.FC = () => {
  const { t } = useLanguage();
  const { data: astrospots, isLoading } = useQuery({
    queryKey: ["community-astrospots-supabase"],
    queryFn: fetchCommunityAstroSpots,
  });

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
        <ul className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {astrospots.map((spot: any) => (
            <li
              key={spot.id}
              className="bg-gradient-to-tr from-cosmic-900/95 to-cosmic-800/80 border border-cosmic-700/30 rounded-lg p-4 shadow-md hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-base truncate group-hover:text-primary">
                  {spot.name || t("Unnamed Location", "未命名位置")}
                </span>
                {typeof spot.siqs === "number" && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-700/60 text-xs text-blue-100 font-bold tracking-tighter">
                    SIQS {Number(spot.siqs).toFixed(1)}
                  </span>
                )}
                {spot.bortleScale && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-600/90 text-xs text-yellow-100 font-medium">
                    {t("Bortle", "博特尔")} {spot.bortleScale}
                  </span>
                )}
              </div>
              <div className="flex gap-2 items-center text-xs text-muted-foreground mb-1">
                <span>
                  📍 {spot.latitude?.toFixed(4)}, {spot.longitude?.toFixed(4)}
                </span>
              </div>
              {spot.description && (
                <div className="mt-2 text-xs text-card-foreground/90 line-clamp-3">{spot.description}</div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="w-full text-muted-foreground/70 text-center py-16">
          {t("No community astrospots yet. Be the first to share!", "还没有社区观星点，快来分享吧！")}
        </div>
      )}
    </div>
  );
};

export default CommunityAstroSpots;


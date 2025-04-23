
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getRecommendedPhotoPoints } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import LazyMapContainer from "@/components/photoPoints/map/LazyMapContainer";
import { Loader } from "lucide-react";

const DEFAULT_CENTER: [number, number] = [30, 104];

const fetchAllAstroSpots = async () => {
  // Fetch a large number to approximate "all"
  return await getRecommendedPhotoPoints(30, 104, 10000, false, 100);
};

const CommunityAstroSpots: React.FC = () => {
  const { t } = useLanguage();
  const { data: astrospots, isLoading } = useQuery<SharedAstroSpot[]>({
    queryKey: ["community-astrospots"],
    queryFn: fetchAllAstroSpots,
  });

  return (
    <div className="max-w-5xl mx-auto pt-6 px-2 pb-2">
      <h1 className="text-2xl font-bold mb-3">{t("Community Astrospots", "社区观星地")}</h1>
      <p className="mb-5 text-muted-foreground">{t("Explore astrospots shared by the community! View them on the map and discover new stargazing locations around the world.", "浏览所有用户共同分享的观星地点，在地图上探索世界各地的拍摄点。")}</p>

      <div className="rounded-lg mb-7 overflow-hidden" style={{ height: 350, minHeight: 275 }}>
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

      <h2 className="font-semibold text-lg mb-2">{t("All Community Astrospots", "全部社区观星地")}</h2>
      <ul className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {astrospots?.map(spot => (
          <li key={spot.id} className="bg-card rounded-lg p-4 shadow hover:bg-primary/5 transition-colors">
            <div className="font-semibold text-base">{spot.name || t("Unnamed Location", "未命名位置")}</div>
            <div className="text-xs text-muted-foreground">{spot.chineseName}</div>
            <div className="text-xs text-muted-foreground">{spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}</div>
            <div className="text-xs text-yellow-600 mt-1">
              {t("Bortle", "博特尔")}: {spot.bortleScale}, SIQS: {typeof spot.siqs === "number" ? spot.siqs.toFixed(1) : (spot.siqs?.score ?? "N/A")}
            </div>
            <div className="mt-2 text-xs">{spot.description}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommunityAstroSpots;


import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAstroSpots } from "@/lib/api/fetchCommunityAstroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import LazyMapContainer from "@/components/photoPoints/map/LazyMapContainer";
import { Loader } from "lucide-react";
import BackButton from "@/components/navigation/BackButton";

const DEFAULT_CENTER: [number, number] = [30, 104];

const CommunityAstroSpots: React.FC = () => {
  const { t } = useLanguage();
  const { data: astrospots, isLoading } = useQuery({
    queryKey: ["community-astrospots-supabase"],
    queryFn: fetchCommunityAstroSpots,
  });

  // Enhanced, vivid gradient background and shadow effect
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#201B2D] via-[#201542]/80 to-[#221F26] pb-12 pt-8 px-2 relative">
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Title Box */}
        <div className="flex items-center gap-3 mb-5">
          <BackButton destination="/" className="shrink-0" />
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gradient-primary">
              <span className="bg-gradient-to-br from-primary via-[#9b87f5] to-[#6E59A5] bg-clip-text text-transparent drop-shadow-xl">
                SIQS Community
              </span>
            </h1>
            <div className="extending-bar h-1 w-20 bg-primary/60 rounded-full mt-1 sm:ml-1 animate-pulse"></div>
          </div>
        </div>

        <div className="mb-7 md:mb-10 rounded-xl px-5 py-4 shadow-glow glassmorphism border border-white/10 max-w-2xl">
          <p className="mb-1 italic text-base text-primary font-medium md:text-lg text-gradient-primary">
            {t(
              "Explore astrospots shared by the community! View them on the map and discover new stargazing locations added by SIQS users.",
              "浏览所有SIQS用户分享的观星地点，在地图上探索社区最新的拍摄点。"
            )}
          </p>
          <p className="text-muted-foreground text-xs md:text-sm">
            {t(
              "Each place on this page was contributed by a star enthusiast just like you.",
              "本页面的每一处地点均由热爱星空的用户共同创建。"
            )}
          </p>
        </div>

        {/* Map Section */}
        <div className="rounded-2xl mb-8 overflow-hidden drop-shadow-lg border border-primary/15 bg-[#22233a]/60 glassmorphism" style={{ height: 370, minHeight: 270 }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full w-full bg-cosmic-800/10">
              <Loader className="h-8 w-8 animate-spin text-primary" />
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
              // Provide a prop for community mode so the correct popup is used
              mapMode="community"
            />
          )}
        </div>

        {/* All Community Astrospots List */}
        <h2 className="font-semibold text-xl md:text-2xl mb-5 text-gradient-primary">
          {t("All Community Astrospots", "全部社区观星地")}
        </h2>
        <ul className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {astrospots?.map((spot: any) => (
            <li key={spot.id} className="bg-gradient-to-tr from-[#221F26]/95 via-[#2e2846]/95 to-[#1a1f2c]/90 border border-primary/5 rounded-xl p-5 shadow-glow hover:shadow-2xl hover:scale-[1.01] transition-all duration-200">
              <div className="font-bold text-lg mb-0.5 text-white flex items-center gap-2">
                {spot.name || t("Unnamed Location", "未命名位置")}
                {/* Optionally show SIQS or user */}
              </div>
              <div className="text-xs text-muted-foreground mb-1">
                {spot.latitude?.toFixed(4)}, {spot.longitude?.toFixed(4)}
              </div>
              <div className="text-xs text-yellow-600 mb-1">
                {t("Bortle", "博特尔")}: {spot.bortleScale}, SIQS:{" "}
                {typeof spot.siqs === "number"
                  ? Number(spot.siqs).toFixed(1)
                  : spot.siqs || "N/A"}
              </div>
              <div className="flex items-center gap-2 mt-2 mb-1">
                <span className="inline-block text-xs text-[#8E9196]">
                  {t("Created by", "创建者")}:
                </span>
                <a
                  href={
                    spot.creator_id
                      ? `/profile?userId=${spot.creator_id}`
                      : "#"
                  }
                  className="text-xs text-primary underline hover:opacity-80 transition"
                >
                  {spot.creator_username
                    ? spot.creator_username
                    : t("Anonymous", "匿名用户")}
                </a>
              </div>
              <div className="mt-2 text-xs text-gray-200 leading-relaxed">
                {spot.description}
              </div>
              <div className="flex mt-3 gap-2">
                <a
                  href={
                    spot.creator_id
                      ? `/profile?userId=${spot.creator_id}`
                      : "#"
                  }
                  className="inline-block px-3 py-1 rounded-lg bg-primary/80 text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition"
                  aria-label={t("View Profile", "查看资料")}
                >
                  {t("View Profile", "查看资料")}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Subtle cosmic background accent */}
      <div className="absolute pointer-events-none top-0 left-0 right-0 min-h-[300px] opacity-40 z-0" style={{
        backgroundImage: `radial-gradient(ellipse at 60% 0, #8B5CF622 0%, transparent 70%), radial-gradient(circle at 20% 20%, #0EA5E933 10%, transparent 65%)`
      }} />
    </div>
  );
};

export default CommunityAstroSpots;

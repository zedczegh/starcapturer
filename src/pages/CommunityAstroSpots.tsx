
import React, { useState, useCallback, Suspense, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAstroSpots } from "@/lib/api/fetchCommunityAstroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { Circle } from "lucide-react";
import PhotoPointsLayout from "@/components/photoPoints/PhotoPointsLayout";
import { motion } from "framer-motion";
import CommunityMap from "@/components/community/CommunityMap";
import { Loader2 } from "@/components/ui/loader";
import CommunityLocationsList from "@/components/community/CommunityLocationsList";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUserGeolocation } from "@/hooks/community/useUserGeolocation";

const DEFAULT_CENTER: [number, number] = [30, 104];

const CommunityAstroSpots: React.FC = () => {
  const { t } = useLanguage();
  const userPosition = useUserGeolocation();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(userPosition);

  // Use optimized query config
  const { data: astrospots, isLoading } = useQuery({
    queryKey: ["community-astrospots-supabase"],
    queryFn: fetchCommunityAstroSpots,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2, // Reduce retry count on mobile
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Shorter max delay
    refetchOnReconnect: true,
    refetchInterval: 1000 * 60 * 15, // Refresh every 15 minutes
    // Skip initial data transform to speed up first render
    select: (data) => data,
  });

  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    setUserLocation([lat, lng]);
  }, []);

  // Effect to update user location when geolocation is available
  useEffect(() => {
    if (userPosition) {
      setUserLocation(userPosition);
    }
  }, [userPosition]);

  // Simplified animation variants for better performance on mobile
  const titleVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };
  
  const lineVariants = {
    hidden: { width: 0, opacity: 0 },
    visible: { width: 90, opacity: 1, transition: { delay: 0.2, duration: 0.4 } }
  };
  
  const descVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.4 } }
  };

  return (
    <TooltipProvider>
      <PhotoPointsLayout pageTitle={t("Astrospots Community | SIQS", "观星社区 | SIQS")}>
        <div className="max-w-5xl mx-auto pt-10 px-4 pb-14">
          <motion.div
            className="flex flex-col items-center justify-center gap-3 mb-9"
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              className="font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent text-3xl md:text-4xl text-center drop-shadow tracking-tight"
              variants={titleVariants}
            >
              {t("Astrospots Community", "观星社区")}
            </motion.h1>
            <motion.div
              className="rounded-full h-1 bg-gradient-to-r from-blue-400 to-purple-400 mb-1"
              style={{ width: 90, maxWidth: "40vw" }}
              variants={lineVariants}
            />
            <motion.p
              className="text-center mb-2 mt-1 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed"
              variants={descVariants}
            >
              {t(
                "Discover and explore astrospots contributed by our SIQS community members. View their favorite stargazing locations on the interactive map and find inspiration for your next adventure.",
                "由SIQS社区成员贡献的观星点，在这里一览无余。浏览大家推荐的拍摄位置，探索灵感，发现下次观星之旅的新去处。"
              )}
            </motion.p>
          </motion.div>

          <Suspense fallback={
            <div className="rounded-xl mb-9 shadow-glow overflow-hidden ring-1 ring-cosmic-700/10 bg-gradient-to-tr from-cosmic-900 via-cosmic-800/90 to-blue-950/70 relative" style={{ height: 280, minHeight: 275 }}>
              <div className="absolute inset-0 flex justify-center items-center bg-cosmic-900/20 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary/80" />
              </div>
            </div>
          }>
            <div className="rounded-xl mb-9 shadow-glow overflow-hidden ring-1 ring-cosmic-700/10 bg-gradient-to-tr from-cosmic-900 via-cosmic-800/90 to-blue-950/70 relative" style={{ height: 280, minHeight: 275 }}>
              <CommunityMap
                center={userLocation || DEFAULT_CENTER}
                locations={astrospots ?? []}
                hoveredLocationId={null}
                isMobile={true}
                zoom={userLocation ? 7 : 3} // Use smaller zoom to improve performance
                onLocationUpdate={handleLocationUpdate}
              />
            </div>
          </Suspense>

          <h2 className="font-bold text-xl mt-12 mb-5 flex items-center gap-2 text-gradient-blue">
            <Circle className="h-4 w-4 text-primary" />
            <span>{t("All Community Astrospots", "全部社区地点")}</span>
          </h2>

          <CommunityLocationsList locations={astrospots} isLoading={isLoading} />
        </div>
      </PhotoPointsLayout>
    </TooltipProvider>
  );
};

export default CommunityAstroSpots;

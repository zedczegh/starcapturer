
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAstroSpots } from "@/lib/api/fetchCommunityAstroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import LazyMapContainer from "@/components/photoPoints/map/LazyMapContainer";
import { Loader, Star, Circle } from "lucide-react";
import LocationCard from "@/components/LocationCard";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";
import PhotoPointsLayout from "@/components/photoPoints/PhotoPointsLayout";
import { motion } from "framer-motion";

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

  // Header animation variants
  const titleVariants = {
    hidden: { opacity: 0, scale: 0.96, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { delay: 0.1, duration: 0.6, ease: "easeOut" } }
  };
  const lineVariants = {
    hidden: { width: 0, opacity: 0 },
    visible: { width: 90, opacity: 1, transition: { delay: 0.35, duration: 0.7, ease: "easeOut" } }
  };
  const descVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.45, duration: 0.6, ease: "easeOut" } }
  };

  return (
    <PhotoPointsLayout pageTitle={t("Astrospots Community | SIQS", "社区观星点 | SIQS")}>
      <div className="max-w-5xl mx-auto pt-10 px-4 pb-14">
        {/* Header Section with Gradient, Animated Line & Better Layout */}
        <div className="mb-9">
          <motion.div
            className="flex flex-col items-center justify-center gap-3"
            initial="hidden"
            animate="visible"
            variants={{}}
          >
            <motion.h1
              className="font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent text-3xl md:text-4xl text-center drop-shadow tracking-tight"
              variants={titleVariants}
            >
              {t("Astrospots Community", "社区观星点")}
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
        </div>

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

        <h2 className="font-bold text-xl mt-12 mb-5 flex items-center gap-2 text-gradient-blue">
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
                  timestamp={spot.timestamp}
                  isCertified={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full text-muted-foreground/70 text-center py-16">
            {t("No community astrospots yet. Be the first to share!", "还没有社区观星点，快来分享吧！")}
          </div>
        )}
      </div>
    </PhotoPointsLayout>
  );
};

export default CommunityAstroSpots;

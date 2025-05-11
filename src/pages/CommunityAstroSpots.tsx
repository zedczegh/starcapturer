
import React, { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCommunityAstroSpots } from "@/lib/api/fetchCommunityAstroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader, Star, Circle } from "lucide-react";
import LocationCard from "@/components/LocationCard";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";
import PhotoPointsLayout from "@/components/photoPoints/PhotoPointsLayout";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import CommunityMap from "@/components/community/CommunityMap";
import { Loader2 } from "@/components/ui/loader";
import CommunityLocationsSkeleton from "@/components/community/CommunityLocationsSkeleton";
import { sortLocationsBySiqs } from "@/utils/siqsHelpers";
import { useIsMobile } from "@/hooks/use-mobile";

const DEFAULT_CENTER: [number, number] = [30, 104];

const CommunityAstroSpots: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Use React Query to fetch data with improved caching
  const { data: astrospots, isLoading } = useQuery({
    queryKey: ["community-astrospots-supabase"],
    queryFn: fetchCommunityAstroSpots,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const [realTimeSiqs, setRealTimeSiqs] = useState<Record<string, number | null>>({});
  const [loadingSiqs, setLoadingSiqs] = useState<Record<string, boolean>>({});
  const [siqsConfidence, setSiqsConfidence] = useState<Record<string, number>>({});
  const [stabilizedSiqs, setStabilizedSiqs] = useState<Record<string, number | null>>({});
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Handle SIQS calculation results with rate limiting for mobile
  const handleSiqsCalculated = useCallback((spotId: string, siqs: number | null, loading: boolean, confidence?: number) => {
    setLoadingSiqs(prev => ({
      ...prev,
      [spotId]: loading
    }));
    
    if (siqs !== null) {
      setRealTimeSiqs(prev => ({
        ...prev,
        [spotId]: siqs
      }));
      
      // Update stabilized scores to prevent flickering
      if (siqs > 0) {
        setStabilizedSiqs(prev => ({
          ...prev, 
          [spotId]: siqs
        }));
      }
    }
    
    if (confidence) {
      setSiqsConfidence(prev => ({
        ...prev,
        [spotId]: confidence
      }));
    }
  }, []);

  // Track user location for better map experience
  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    console.log("Location updated:", lat, lng);
    setUserLocation([lat, lng]);
  }, []);

  // Sort locations by SIQS scores (highest first)
  const sortedAstroSpots = React.useMemo(() => {
    if (!astrospots) return [];
    
    // Add real-time SIQS values to spots for sorting
    const spotsWithRealtimeSiqs = astrospots.map(spot => ({
      ...spot,
      realTimeSiqs: stabilizedSiqs[spot.id] ?? realTimeSiqs[spot.id] ?? spot.siqs
    }));
    
    // Sort using the utility function
    return sortLocationsBySiqs(spotsWithRealtimeSiqs);
  }, [astrospots, realTimeSiqs, stabilizedSiqs]);

  // Animation variants
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

  // Navigate to astro spot profile with proper state
  const handleCardClick = (id: string) => {
    // Ensure we're passing the correct state to properly identify where we came from
    navigate(`/astro-spot/${id}`, { 
      state: { 
        from: 'community',
        spotId: id 
      } 
    });
    console.log("Navigating to astro spot:", id);
  };

  // Effect to start staggered loading of SIQS data
  useEffect(() => {
    if (!astrospots || astrospots.length === 0) return;
    
    // On mobile, we'll load SIQS data in batches to optimize performance
    const spotsThatNeedLoading = astrospots.filter(spot => 
      !realTimeSiqs[spot.id] && !loadingSiqs[spot.id]
    );
    
    if (spotsThatNeedLoading.length === 0) return;
    
    // Prioritize spots in viewport
    const batchSize = isMobile ? 2 : 5;
    const delay = isMobile ? 400 : 200;
    
    // Schedule loading of each batch
    spotsThatNeedLoading.slice(0, 10).forEach((spot, index) => {
      const batchIndex = Math.floor(index / batchSize);
      setTimeout(() => {
        setLoadingSiqs(prev => ({
          ...prev,
          [spot.id]: true
        }));
      }, delay * batchIndex);
    });
  }, [astrospots, realTimeSiqs, loadingSiqs, isMobile]);

  return (
    <PhotoPointsLayout pageTitle={t("Astrospots Community | SIQS", "观星社区 | SIQS")}>
      <div className="max-w-5xl mx-auto pt-10 px-4 pb-14">
        <motion.div
          className="flex flex-col items-center justify-center gap-3 mb-9"
          initial="hidden"
          animate="visible"
          variants={{}}
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

        <div className="rounded-xl mb-9 shadow-glow overflow-hidden ring-1 ring-cosmic-700/10 bg-gradient-to-tr from-cosmic-900 via-cosmic-800/90 to-blue-950/70 relative" style={{ height: 380, minHeight: 275 }}>
          {isLoading ? (
            <div className="absolute inset-0 flex justify-center items-center bg-cosmic-900/20 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary/80" />
            </div>
          ) : (
            <CommunityMap
              center={userLocation || DEFAULT_CENTER}
              locations={sortedAstroSpots ?? []}
              hoveredLocationId={null}
              isMobile={isMobile}
              zoom={userLocation ? 8 : 3}
              onLocationUpdate={handleLocationUpdate}
              onMarkerClick={handleCardClick} // Pass the click handler to the map
            />
          )}
        </div>

        <h2 className="font-bold text-xl mt-12 mb-5 flex items-center gap-2 text-gradient-blue">
          <Circle className="h-4 w-4 text-primary" />
          <span>{t("All Community Astrospots", "全部社区地点")}</span>
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({t("Sorted by best SIQS score", "按照SIQS评分排序")})
          </span>
        </h2>

        {isLoading ? (
          <CommunityLocationsSkeleton />
        ) : sortedAstroSpots && sortedAstroSpots.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {sortedAstroSpots.map((spot: any) => (
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
                    isVisible={loadingSiqs[spot.id] || (!realTimeSiqs[spot.id] && !stabilizedSiqs[spot.id])}
                    latitude={spot.latitude}
                    longitude={spot.longitude}
                    bortleScale={spot.bortleScale}
                    existingSiqs={spot.siqs}
                    onSiqsCalculated={(siqs, loading, confidence) =>
                      handleSiqsCalculated(spot.id, siqs, loading, confidence)
                    }
                    priorityLevel={isMobile ? 'low' : 'medium'}
                    debugLabel={`community-card-${spot.id.substring(0, 6)}`}
                  />
                  <div className="transition-shadow group-hover:shadow-xl group-hover:ring-2 group-hover:ring-primary rounded-xl">
                    <LocationCard
                      id={spot.id}
                      name={spot.name}
                      latitude={spot.latitude}
                      longitude={spot.longitude}
                      siqs={stabilizedSiqs[spot.id] ?? realTimeSiqs[spot.id] ?? spot.siqs}
                      timestamp={spot.timestamp}
                      isCertified={false}
                      siqsLoading={loadingSiqs[spot.id] && !stabilizedSiqs[spot.id]}
                    />
                  </div>
                  <span className="absolute inset-0 rounded-xl z-10 transition bg-black/0 group-hover:bg-primary/5" />
                </div>
              </button>
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

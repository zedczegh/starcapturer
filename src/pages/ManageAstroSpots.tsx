import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from "@/components/NavBar";
import AstroFooter from "@/components/index/AstroFooter";
import AstroSpotsLoadingSkeleton from "@/components/astro-spots/AstroSpotsLoadingSkeleton";
import AstroSpotsHeader from '@/components/astro-spots/AstroSpotsHeader';
import EmptyAstroSpotsState from '@/components/astro-spots/EmptyAstroSpotsState';
import AstroSpotGrid from '@/components/astro-spots/AstroSpotGrid';
import { useAstroSpots } from '@/hooks/astro-spots/useAstroSpots';
import { useNotifications } from '@/hooks/useNotifications';
import LocationStatusMessage from "@/components/location/LocationStatusMessage";

const ManageAstroSpots = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { markAstroSpotsAsViewed } = useNotifications();
  
  const {
    spots,
    isLoading,
    editMode,
    setEditMode,
    handleDelete,
    realTimeSiqs,
    handleSiqsCalculated,
    refetch
  } = useAstroSpots();

  // Mark AstroSpots as viewed when the component mounts
  useEffect(() => {
    if (user) {
      markAstroSpotsAsViewed();
    }
  }, [user, markAstroSpotsAsViewed]);

  // Auto-refresh when user changes to prevent cached data from previous user
  useEffect(() => {
    if (user) {
      console.log('User changed, refreshing AstroSpots data for user:', user.id);
      refetch();
    }
  }, [user?.id, refetch]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8 pt-16 md:pt-20">
          <LocationStatusMessage
            message={t("Please sign in to manage your AstroSpots", "请登录以管理您的观星点")}
            type="error"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 relative">
      <NavBar />
      <div className="container mx-auto px-4 py-8 pt-16 md:pt-20 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-2">
            {t("My AstroSpots", "我的观星点")}
          </h1>
          <p className="text-cosmic-400">
            {t("Manage and share your astronomy observation spots", "管理和分享您的天文观测点")}
          </p>
        </div>

        <AstroSpotsHeader
          spotsCount={spots?.length || 0}
          editMode={editMode}
          onToggleEditMode={() => setEditMode(!editMode)}
        />
        
        <div className="mt-8 bg-cosmic-900/60 glassmorphism rounded-2xl border border-cosmic-700/40 shadow-glow px-4 py-8">
          {isLoading ? (
            <AstroSpotsLoadingSkeleton />
          ) : spots && spots.length > 0 ? (
            <AstroSpotGrid
              spots={spots}
              editMode={editMode}
              onDelete={handleDelete}
              onSiqsCalculated={handleSiqsCalculated}
              realTimeSiqs={realTimeSiqs}
            />
          ) : (
            <EmptyAstroSpotsState />
          )}
        </div>
      </div>
      <AstroFooter />
    </div>
  );
};

export default ManageAstroSpots;

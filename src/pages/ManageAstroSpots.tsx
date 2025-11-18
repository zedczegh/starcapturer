import React, { useEffect, useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

const ManageAstroSpots = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { markAstroSpotsAsViewed } = useNotifications();
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  
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

  // Load user's background image
  useEffect(() => {
    const loadBackground = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('background_image_url')
          .eq('id', authUser.id)
          .single();
        if (profile?.background_image_url) {
          setBackgroundUrl(profile.background_image_url);
        }
      }
    };
    loadBackground();
  }, []);

  // Auto-refresh when user changes to prevent cached data from previous user
  useEffect(() => {
    if (user) {
      console.log('User changed, refreshing AstroSpots data for user:', user.id);
      refetch();
    }
  }, [user?.id, refetch]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-cosmic-900">
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
    <div className="min-h-screen relative">
      {backgroundUrl && (
        <div className="fixed inset-0 z-0">
          <img src={backgroundUrl} alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 via-20% to-transparent"></div>
        </div>
      )}
      <div className="relative z-10 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-cosmic-900"
           style={{ backgroundColor: backgroundUrl ? 'transparent' : undefined }}
      >
      <NavBar />
      <div className="container mx-auto px-4 py-8 pt-16 md:pt-20 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            {t("My Meteo Spots", "我的气象点")}
          </h1>
          <p className="text-cosmic-400">
            {t("Manage and share your favorite outdoor adventure locations", "管理和分享您最喜欢的户外探险地点")}
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
    </div>
  );
};

export default ManageAstroSpots;

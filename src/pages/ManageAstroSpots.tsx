
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import NavBar from "@/components/NavBar";
import AstroFooter from "@/components/index/AstroFooter";
import AstroSpotsLoadingSkeleton from "@/components/astro-spots/AstroSpotsLoadingSkeleton";
import AstroSpotsHeader from '@/components/astro-spots/AstroSpotsHeader';
import EmptyAstroSpotsState from '@/components/astro-spots/EmptyAstroSpotsState';
import AstroSpotGrid from '@/components/astro-spots/AstroSpotGrid';
import { useAstroSpots } from '@/hooks/astro-spots/useAstroSpots';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

const ManageAstroSpots = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const {
    spots,
    isLoading,
    editMode,
    setEditMode,
    handleDelete,
    realTimeSiqs,
    handleSiqsCalculated
  } = useAstroSpots();

  // Ensure spots have timestamp (required by SharedAstroSpot)
  const validSpots: SharedAstroSpot[] = React.useMemo(() => {
    if (!spots) return [];
    return spots.map(spot => ({
      ...spot,
      timestamp: spot.timestamp || new Date().toISOString()
    }));
  }, [spots]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-8">
          <p className="text-muted-foreground">
            {t("Please sign in to manage your AstroSpots", "请登录以管理您的观星点")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 relative">
      <div
        className="fixed inset-0 z-0 pointer-events-none select-none"
        aria-hidden="true"
        style={{
          background: "url('/lovable-uploads/bae4bb9f-d2ce-4f1b-9eae-e0e022866a36.png') center center / cover no-repeat",
          filter: 'blur(2.5px) brightness(0.88) saturate(1.14)',
        }}
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'linear-gradient(120deg, rgba(10,17,34,0.87) 0%, rgba(40,22,44,0.80) 100%)',
        }}
      />
      <NavBar />
      <div className="relative z-10 container py-10 px-2 md:px-6">
        <AstroSpotsHeader
          spotsCount={validSpots?.length || 0}
          editMode={editMode}
          onToggleEditMode={() => setEditMode(!editMode)}
        />

        <div className="bg-cosmic-900/60 glassmorphism rounded-2xl border border-cosmic-700/40 shadow-glow px-4 py-8 md:py-10">
          {isLoading ? (
            <AstroSpotsLoadingSkeleton />
          ) : validSpots && validSpots.length > 0 ? (
            <AstroSpotGrid
              spots={validSpots}
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


import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Mountain, Eye, Camera, Heart } from 'lucide-react';
import { CircularTabs } from "@/components/ui/circular-tabs";
import { prepareLocationForNavigation } from "@/utils/locationNavigation";
import { sortLocationsBySiqs } from "./collections/sortLocationsBySiqs";
import PageLoader from "@/components/loaders/PageLoader";
import LocationStatusMessage from "@/components/location/LocationStatusMessage";
import { useUserCollections } from "@/hooks/collections/useUserCollections";
import { useUserAstroSpotCollections } from "@/hooks/collections/useUserAstroSpotCollections";
import { useCollectedPosts } from "@/hooks/collections/useCollectedPosts";
import CollectionsLoadingSkeleton from "@/components/collections/CollectionsLoadingSkeleton";
import CollectionHeader from "@/components/collections/CollectionHeader";
import CollectionGrid from "@/components/collections/CollectionGrid";
import AstroSpotCollectionGrid from "@/components/collections/AstroSpotCollectionGrid";
import { CollectedPostsGrid } from "@/components/collections/CollectedPostsGrid";
import EmptyCollections from "@/components/collections/EmptyCollections";
import { useCollectionActions } from "@/hooks/collections/useCollectionActions";
import { useAstroSpotCollectionActions } from "@/hooks/collections/useAstroSpotCollectionActions";
import { supabase } from "@/integrations/supabase/client";

const Collections = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('locations');
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

  // Location collections
  const {
    locations,
    setLocations,
    loading: locationsLoading,
    authChecked: locationsAuthChecked,
    error: locationsError,
    forceReload: reloadLocations,
  } = useUserCollections();

  // AstroSpot collections
  const {
    spots,
    setSpots,
    loading: spotsLoading,
    authChecked: spotsAuthChecked,
    error: spotsError,
    forceReload: reloadSpots,
  } = useUserAstroSpotCollections();

  // Collected posts
  const {
    posts: collectedPosts,
    loading: postsLoading,
    authChecked: postsAuthChecked,
    error: postsError,
  } = useCollectedPosts();

  // Location collection actions
  const {
    editingNames: editingLocationNames,
    savingNames: savingLocationNames,
    handleNameChange: handleLocationNameChange,
    handleDelete: handleLocationDelete,
    handleSaveName: handleLocationSaveName,
  } = useCollectionActions(locations, setLocations, reloadLocations);

  // AstroSpot collection actions
  const {
    editingNames: editingSpotNames,
    savingNames: savingSpotNames,
    handleNameChange: handleSpotNameChange,
    handleDelete: handleSpotDelete,
    handleSaveName: handleSpotSaveName,
  } = useAstroSpotCollectionActions(spots, setSpots, reloadSpots);

  const handleViewLocationDetails = (location: any) => {
    const { locationId, locationState } = prepareLocationForNavigation(location);
    if (locationId) {
      navigate(`/location/${locationId}`, { state: locationState });
    }
  };

  const handleViewSpotDetails = (spot: any) => {
    navigate(`/astro-spot/${spot.spot_id}`);
  };

  const authChecked = locationsAuthChecked && spotsAuthChecked && postsAuthChecked;
  const loading = locationsLoading || spotsLoading || postsLoading;
  const hasError = locationsError || spotsError || postsError;

  // Load user's background image
  useEffect(() => {
    const loadBackground = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('background_image_url')
          .eq('id', user.id)
          .single();
        if (profile?.background_image_url) {
          setBackgroundUrl(profile.background_image_url);
        }
      }
    };
    loadBackground();
  }, [user]);

  if (!authChecked) return <PageLoader />;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-cosmic-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8 pt-16 md:pt-20">
          <LocationStatusMessage
            message={t("Please sign in to view your collections", "请登录以查看您的收藏")}
            type="error"
          />
        </div>
      </div>
    );
  }

  // Ensure we have valid arrays, even if empty
  const safeLocations = Array.isArray(locations) ? locations : [];
  const safeSpots = Array.isArray(spots) ? spots : [];
  
  const sortedLocations = sortLocationsBySiqs(safeLocations);
  const safePosts = Array.isArray(collectedPosts) ? collectedPosts : [];
  const totalItems = safeLocations.length + safeSpots.length + safePosts.length;
  
  // Sort function for spots by SIQS (high to low)
  const sortSpotsBySiqs = (spots: any[]) => {
    return [...spots].sort((a, b) => {
      const siqsA = a?.siqs ?? 0;
      const siqsB = b?.siqs ?? 0;
      return siqsB - siqsA; // High to low
    });
  };
  
  // Filter spots by type and sort by SIQS
  const nightscapeSpots = sortSpotsBySiqs(safeSpots.filter(spot => spot?.spot_type === 'nightscape'));
  const naturalSpots = sortSpotsBySiqs(safeSpots.filter(spot => spot?.spot_type === 'natural'));
  const obscuraSpots = sortSpotsBySiqs(safeSpots.filter(spot => spot?.spot_type === 'obscura'));

  const collectionTabs = [
    { value: 'locations', label: t('Photo Locations', '拍摄地点'), icon: Camera, count: safeLocations.length },
    { value: 'posts', label: t('Collected Posts', '收藏帖子'), icon: Heart, count: safePosts.length },
    { value: 'nightscape', label: t('Nightscape', '夜景地点'), icon: Moon, count: nightscapeSpots.length },
    { value: 'natural', label: t('Natural', '自然风光'), icon: Mountain, count: naturalSpots.length },
    { value: 'obscura', label: t('Obscura', '探索奇观'), icon: Eye, count: obscuraSpots.length },
  ];

  return (
    <div className="min-h-screen relative">
      {backgroundUrl && (
        <div className="fixed inset-0 z-0">
          <img src={backgroundUrl} alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-60% to-slate-900"></div>
          <div className="absolute inset-0 bg-slate-900/60"></div>
        </div>
      )}
      <div className="relative z-10 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-cosmic-900"
           style={{ backgroundColor: backgroundUrl ? 'transparent' : undefined }}>
        <NavBar />
        <TooltipProvider>
        <main className="container mx-auto px-4 py-8 pt-16 md:pt-20 flex-grow">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                {t("My Collections", "我的收藏")}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-cosmic-300">
                  {t("Total Items", "总数")}: <span className="text-primary font-medium">{totalItems}</span>
                </span>
                <Button
                  onClick={() => setEditMode(prev => !prev)}
                  variant="outline"
                  size="sm"
                  className="bg-cosmic-800/30 border-cosmic-700/50 hover:bg-cosmic-700/50"
                >
                  {editMode ? t("Done", "完成") : t("Edit", "编辑")}
                </Button>
              </div>
            </div>
            <p className="text-cosmic-400">
              {t("Manage your saved locations and astro spots", "管理已收藏的拍摄地点和小众景点")}
            </p>
          </div>

          {hasError && (
            <div className="mb-6">
              <LocationStatusMessage 
                message={t("Some collections could not be loaded. Please try refreshing the page.", "部分收藏无法加载，请尝试刷新页面。")}
                type="error" 
              />
            </div>
          )}

          {/* Circular Tabs Navigation */}
          <CircularTabs 
            tabs={collectionTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="mb-8"
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="locations" className="space-y-4 mt-0">
              {loading && !safeLocations.length ? (
                <CollectionsLoadingSkeleton />
              ) : safeLocations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-cosmic-400 mb-4">
                    {t("No photo locations saved yet", "还没有收藏任何拍摄地点")}
                  </div>
                  <Button 
                    onClick={() => navigate('/photo-points')}
                    variant="outline"
                    className="bg-cosmic-800/30 border-cosmic-700/50 hover:bg-cosmic-700/50"
                  >
                    {t("Explore Locations", "探索地点")}
                  </Button>
                </div>
              ) : (
                <CollectionGrid
                  locations={sortedLocations}
                  editMode={editMode}
                  editingNames={editingLocationNames}
                  savingNames={savingLocationNames}
                  onNameChange={handleLocationNameChange}
                  onSaveName={handleLocationSaveName}
                  onDelete={handleLocationDelete}
                  onViewDetails={handleViewLocationDetails}
                />
            )}
          </TabsContent>

          <TabsContent value="posts" className="space-y-4 mt-0">
            {loading && !safePosts.length ? (
              <CollectionsLoadingSkeleton />
            ) : safePosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-cosmic-400 mb-4">
                  {t("No collected posts yet", "还没有收藏任何帖子")}
                </div>
                <Button 
                  onClick={() => navigate('/community')}
                  variant="outline"
                  className="bg-cosmic-800/30 border-cosmic-700/50 hover:bg-cosmic-700/50"
                >
                  {t("Explore Community", "浏览社区")}
                </Button>
              </div>
            ) : (
              <CollectedPostsGrid posts={safePosts} />
            )}
          </TabsContent>

          <TabsContent value="nightscape" className="space-y-4">
              {loading && !nightscapeSpots.length ? (
                <CollectionsLoadingSkeleton />
              ) : nightscapeSpots.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-cosmic-400 mb-4">
                    {t("No nightscape spots saved yet", "还没有收藏任何夜景地点")}
                  </div>
                  <Button 
                    onClick={() => navigate('/community')}
                    variant="outline"
                    className="bg-cosmic-800/30 border-cosmic-700/50 hover:bg-cosmic-700/50"
                  >
                    {t("Browse Community", "浏览小众社区")}
                  </Button>
                </div>
              ) : (
                <AstroSpotCollectionGrid
                  spots={nightscapeSpots}
                  editMode={editMode}
                  editingNames={editingSpotNames}
                  savingNames={savingSpotNames}
                  onNameChange={handleSpotNameChange}
                  onSaveName={handleSpotSaveName}
                  onDelete={handleSpotDelete}
                  onViewDetails={handleViewSpotDetails}
                />
              )}
            </TabsContent>

            <TabsContent value="natural" className="space-y-4">
              {loading && !naturalSpots.length ? (
                <CollectionsLoadingSkeleton />
              ) : naturalSpots.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-cosmic-400 mb-4">
                    {t("No natural spots saved yet", "还没有收藏任何自然风光")}
                  </div>
                  <Button 
                    onClick={() => navigate('/community')}
                    variant="outline"
                    className="bg-cosmic-800/30 border-cosmic-700/50 hover:bg-cosmic-700/50"
                  >
                    {t("Browse Community", "浏览小众社区")}
                  </Button>
                </div>
              ) : (
                <AstroSpotCollectionGrid
                  spots={naturalSpots}
                  editMode={editMode}
                  editingNames={editingSpotNames}
                  savingNames={savingSpotNames}
                  onNameChange={handleSpotNameChange}
                  onSaveName={handleSpotSaveName}
                  onDelete={handleSpotDelete}
                  onViewDetails={handleViewSpotDetails}
                />
              )}
            </TabsContent>

            <TabsContent value="obscura" className="space-y-4">
              {loading && !obscuraSpots.length ? (
                <CollectionsLoadingSkeleton />
              ) : obscuraSpots.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-cosmic-400 mb-4">
                    {t("No obscura spots saved yet", "还没有收藏任何奇观地点")}
                  </div>
                  <Button 
                    onClick={() => navigate('/community')}
                    variant="outline"
                    className="bg-cosmic-800/30 border-cosmic-700/50 hover:bg-cosmic-700/50"
                  >
                    {t("Browse Community", "浏览小众社区")}
                  </Button>
                </div>
              ) : (
                <AstroSpotCollectionGrid
                  spots={obscuraSpots}
                  editMode={editMode}
                  editingNames={editingSpotNames}
                  savingNames={savingSpotNames}
                  onNameChange={handleSpotNameChange}
                  onSaveName={handleSpotSaveName}
                  onDelete={handleSpotDelete}
                  onViewDetails={handleViewSpotDetails}
                />
              )}
            </TabsContent>
          </Tabs>
        </main>
      </TooltipProvider>
      </div>
    </div>
  );
};

export default Collections;
